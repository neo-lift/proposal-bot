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
import { getProposalesApiConfig } from "@/lib/proposal";

type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
};

type SendMessageResult = {
  ui: ReactNode;
  usage: TokenUsage | null;
};

// Shared API fetch helper
async function fetchProposalesApiEndpoint(endpoint: string) {
  const { headers, apiBaseUrl } = getProposalesApiConfig();

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return await response.json();
}

// POST API helper for creating proposals
async function postProposalesApi(endpoint: string, body: any) {
  const { headers, apiBaseUrl } = getProposalesApiConfig();

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return await response.json();
}

// Helper function to safely extract string values from localized objects
function getStringValue(value: any): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value !== null) {
    // Try common language keys (en, en-US, etc.)
    if (value.en) return value.en;
    if (value["en-US"]) return value["en-US"];
    // Get first available string value
    const firstKey = Object.keys(value)[0];
    if (firstKey && typeof value[firstKey] === "string") {
      return value[firstKey];
    }
  }
  return null;
}

const sendMessage = async (message: string): Promise<SendMessageResult> => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;
  let latestUsage: TokenUsage | null = null;

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    system: `\
      - you are a friendly proposal assistant that helps fetch and view proposals from the Proposales API
      - reply in lower case
      - use the tools provided to fetch and view proposals, content, companies, and attachments
      - if you need to create a proposal, use the proposalCreate tool
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
      proposalView: {
        description: "Fetch a proposal from the Proposales API by its UUID",
        parameters: z.object({
          uuid: z.string().uuid("The UUID must be a valid UUID format"),
        }),
        generate: async function* ({ uuid }) {
          const toolCallId = generateId();

          try {
            const data = await fetchProposalesApiEndpoint(`/v3/proposals/${uuid}`);

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "proposalView",
                    args: { uuid },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "proposalView",
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
                    toolName: "proposalView",
                    args: { uuid },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "proposalView",
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
      listContent: {
        description: "List content from the Proposales API content endpoint",
        parameters: z.object({}),
        generate: async function* ({ }) {
          const toolCallId = generateId();

          try {
            const data = await fetchProposalesApiEndpoint("/v3/content");

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "listContent",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listContent",
                    toolCallId,
                    result: data,
                  },
                ],
              },
            ]);

            // Format the content list for display
            const contentItems = Array.isArray(data.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

            return (
              <Message
                role="assistant"
                content={
                  <div className="space-y-3">
                    <div className="font-semibold">Content List</div>
                    {contentItems.length > 0 ? (
                      <div className="space-y-2">
                        {contentItems.map((item: any, index: number) => {
                          const title = getStringValue(item.title);
                          const name = getStringValue(item.name);
                          const description = getStringValue(item.description);

                          return (
                            <div
                              key={item.uuid || item.id || index}
                              className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
                            >
                              {title && (
                                <div className="font-medium">{title}</div>
                              )}
                              {name && (
                                <div className="font-medium">{name}</div>
                              )}
                              {item.uuid && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  UUID: {item.uuid}
                                </div>
                              )}
                              {description && (
                                <div className="text-sm mt-2 text-zinc-600 dark:text-zinc-300">
                                  {description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No content items found
                      </div>
                    )}
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      Total items: {contentItems.length}
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
                    toolName: "listContent",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listContent",
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
                    Error fetching content: {errorMessage}
                  </div>
                }
              />
            );
          }
        },
      },
      listCompanies: {
        description: "List companies from the Proposales API companies endpoint",
        parameters: z.object({}),
        generate: async function* ({ }) {
          const toolCallId = generateId();

          try {
            const data = await fetchProposalesApiEndpoint("/v3/companies");

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "listCompanies",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listCompanies",
                    toolCallId,
                    result: data,
                  },
                ],
              },
            ]);

            // Format the companies list for display
            const companies = Array.isArray(data.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

            return (
              <Message
                role="assistant"
                content={
                  <div className="space-y-3">
                    <div className="font-semibold">Companies List</div>
                    {companies.length > 0 ? (
                      <div className="space-y-2">
                        {companies.map((company: any, index: number) => {
                          const name = getStringValue(company.name);
                          const address = getStringValue(company.address);

                          return (
                            <div
                              key={company.uuid || company.id || index}
                              className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
                            >
                              {name && (
                                <div className="font-medium">{name}</div>
                              )}
                              {company.uuid && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  UUID: {company.uuid}
                                </div>
                              )}
                              {company.email && (
                                <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                                  Email: {company.email}
                                </div>
                              )}
                              {address && (
                                <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                                  Address: {address}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No companies found
                      </div>
                    )}
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      Total companies: {companies.length}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      {latestUsage?.totalTokens && latestUsage?.totalTokens > 0 && <span>Total tokens: {latestUsage?.totalTokens.toLocaleString()}</span>}
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
                    toolName: "listCompanies",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listCompanies",
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
                    Error fetching companies: {errorMessage}
                  </div>
                }
              />
            );
          }
        },
      },
      listAttachments: {
        description: "List attachments from the Proposales API attachments endpoint",
        parameters: z.object({}),
        generate: async function* ({ }) {
          const toolCallId = generateId();

          try {
            const data = await fetchProposalesApiEndpoint("/v1/attachments");

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "listAttachments",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listAttachments",
                    toolCallId,
                    result: data,
                  },
                ],
              },
            ]);

            // Format the attachments list for display
            const attachments = Array.isArray(data.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

            return (
              <Message
                role="assistant"
                content={
                  <div className="space-y-3">
                    <div className="font-semibold">Attachments List</div>
                    {attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((attachment: any, index: number) => {
                          const name = getStringValue(attachment.name);
                          const filename = getStringValue(attachment.filename);

                          return (
                            <div
                              key={attachment.uuid || attachment.id || index}
                              className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
                            >
                              {name && (
                                <div className="font-medium">{name}</div>
                              )}
                              {filename && (
                                <div className="font-medium">{filename}</div>
                              )}
                              {attachment.uuid && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  UUID: {attachment.uuid}
                                </div>
                              )}
                              {attachment.type && (
                                <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                                  Type: {attachment.type}
                                </div>
                              )}
                              {attachment.size && (
                                <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                                  Size: {attachment.size} bytes
                                </div>
                              )}
                              {attachment.url && (
                                <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                                  <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                    View attachment
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No attachments found
                      </div>
                    )}
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      Total attachments: {attachments.length}
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
                    toolName: "listAttachments",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "listAttachments",
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
                    Error fetching attachments: {errorMessage}
                  </div>
                }
              />
            );
          }
        },
      },
      proposalCreate: {
        description: "Generate a Proposales Create Proposal JSON payload from an RFP/SFP object.",
        parameters: z.object({
          rfp: z.object({
            customer: z.object({
              customerName: z.string().min(1, "Customer name is required"),
              customerEmail: z.string().email("Valid customer email is required"),
              companyName: z.string().optional(),
            }),
            event: z.object({
              eventType: z.string().min(1, "Event type is required"),
              startDate: z.string().optional(),
              endDate: z.string().optional(),
              guestCount: z.number().optional(),
              roomsNeeded: z.number().optional(),
            }),
            preferences: z.object({
              meetingSpaces: z.boolean().optional(),
              catering: z.boolean().optional(),
              tone: z.string().optional(),
              additionalBrief: z.string().optional(),
            }).optional(),
          }),
        }),
        generate: async function* ({ rfp }) {
          const toolCallId = generateId();
          try {
            const data = await postProposalesApi("/v3/proposals", { rfp });

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "proposalCreate",
                    args: { rfp },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "proposalCreate",
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
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      Proposal created successfully!
                    </div>
                    {data.data?.title && (
                      <div className="font-medium">{data.data.title}</div>
                    )}
                    {data.data?.uuid && (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        UUID: {data.data.uuid}
                      </div>
                    )}
                    {data.data?.status && (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Status: {data.data.status}
                      </div>
                    )}
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
                    toolName: "proposalCreate",
                    args: { rfp },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "proposalCreate",
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
                    Error creating proposal: {errorMessage}
                  </div>
                }
              />
            );
          }
        },
      },
    },
    onFinish: ({ usage }) => {
      latestUsage = usage;
    },
  });

  return { ui: stream, usage: latestUsage };
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
