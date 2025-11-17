import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    system: `\
      - you are a friendly proposal assistant that helps fetch and view proposals from the Proposales API
      - reply in lower case
    `,
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    tools: {
      getProposal: {
        description: "Fetch a proposal from the Proposales API by its UUID",
        parameters: z.object({
          uuid: z.string().uuid("The UUID must be a valid UUID format"),
        }),
        generate: async function* ({ uuid }) {
          const toolCallId = generateId();

          try {
            const apiKey = process.env.PROPOSALES_API_KEY;
            const apiBaseUrl =
              process.env.PROPOSALES_API_BASE_URL ||
              "https://api.proposales.com";

            if (!apiKey) {
              throw new Error(
                "PROPOSALES_API_KEY environment variable is not set",
              );
            }

            const response = await fetch(`${apiBaseUrl}/proposals/${uuid}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Failed to fetch proposal: ${response.status} ${response.statusText} - ${errorText}`,
              );
            }

            const data = await response.json();

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "getProposal",
                    args: { uuid },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "getProposal",
                    toolCallId,
                    result: data,
                  },
                ],
              },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="space-y-2">
                    <div className="font-semibold">{data.data?.title || "Proposal"}</div>
                    {data.data?.description_html && (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: data.data.description_html,
                        }}
                      />
                    )}
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Status: {data.data?.status || "Unknown"} | UUID: {uuid}
                    </div>
                  </div>
                }
              />
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error occurred";

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "getProposal",
                    args: { uuid },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "getProposal",
                    toolCallId,
                    result: { error: errorMessage },
                  },
                ],
              },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-600 dark:text-red-400">
                    Error fetching proposal: {errorMessage}
                  </div>
                }
              />
            );
          }
        },
      },
    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
