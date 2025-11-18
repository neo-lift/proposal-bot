import { Message, TextStreamMessage } from "@/components/shared/message";
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
import { generateProposalPayload, getProposalesApiConfig } from "@/lib/proposal";
import { ProposalViewCard } from "@/components/chatbox/proposal-view-card";
import { ContentListCard } from "@/components/chatbox/contents-list-card";
import { CompaniesListCard } from "@/components/chatbox/companies-list-card";
import { AttachmentsListCard } from "@/components/chatbox/attachments-list-card";
import { ProposalCreateSuccessCard } from "@/components/chatbox/proposal-create-success-card";
import { ErrorCard } from "@/components/shared/error-card";
import { ChainOfThoughtCard } from "@/components/chatbox/chain-of-thought-card";
import { ChainOfThoughtStep, StepStatus } from "@/components/chatbox/chain-of-thought-step";
import { RfpAnalysisDisplay } from "@/components/chatbox/rfp-analysis-display";
import { RequirementsMappingDisplay } from "@/components/chatbox/requirement-mapping-display";
import { PricingCalculationDisplay } from "@/components/chatbox/pricing-calculation-display";

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
                  <ProposalViewCard
                    title={data.data?.title}
                    descriptionHtml={data.data?.description_html}
                    status={data.data?.status}
                    uuid={uuid}
                  />
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
                  <ErrorCard message={errorMessage} context="Error fetching proposal" />
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
                  <ContentListCard items={contentItems} />
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
                  <ErrorCard message={errorMessage} context="Error fetching content" />
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
                  <CompaniesListCard companies={companies} />
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
                  <ErrorCard message={errorMessage} context="Error fetching companies" />
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
                  <AttachmentsListCard attachments={attachments} />
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
                  <ErrorCard message={errorMessage} context="Error fetching attachments" />
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

          // Step 1: Analyze RFP to get the requirements
          yield (
            <Message
              role="assistant"
              content={
                <ChainOfThoughtCard title="Creating Proposal">
                  <ChainOfThoughtStep
                    stepNumber={1}
                    title="Analyzing RFP Requirements"
                    status="in_progress"
                  />
                  <ChainOfThoughtStep
                    stepNumber={2}
                    title="Mapping Requirements to Products"
                    status="pending"
                  />
                  <ChainOfThoughtStep
                    stepNumber={3}
                    title="Calculating Pricing"
                    status="pending"
                  />
                  <ChainOfThoughtStep
                    stepNumber={4}
                    title="Generating Final Proposal"
                    status="pending"
                  />
                </ChainOfThoughtCard>
              }
            />
          );

          // Extract analysis from RFP
          const analysis = {
            eventType: rfp.event.eventType,
            attendees: rfp.event.guestCount,
            rooms: rfp.event.roomsNeeded,
            startDate: rfp.event.startDate,
            endDate: rfp.event.endDate,
            meetingSpaces: rfp.preferences?.meetingSpaces,
            catering: rfp.preferences?.catering,
            meetingDays: rfp.event.startDate && rfp.event.endDate
              ? Math.ceil((new Date(rfp.event.endDate).getTime() - new Date(rfp.event.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
              : undefined,
          };

          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Step 1 Complete
          yield (
            <Message
              role="assistant"
              content={
                <ChainOfThoughtCard title="Creating Proposal">
                  <ChainOfThoughtStep
                    stepNumber={1}
                    title="Analyzing RFP Requirements"
                    status="completed"
                    content={<RfpAnalysisDisplay analysis={analysis} />}
                  />
                  <ChainOfThoughtStep
                    stepNumber={2}
                    title="Mapping Requirements to Products"
                    status="in_progress"
                  />
                  <ChainOfThoughtStep
                    stepNumber={3}
                    title="Calculating Pricing"
                    status="pending"
                  />
                  <ChainOfThoughtStep
                    stepNumber={4}
                    title="Generating Final Proposal"
                    status="pending"
                  />
                </ChainOfThoughtCard>
              }
            />
          );

          // Step 2: Generate proposal payload
          let proposalPayload;
          try {
            proposalPayload = await generateProposalPayload({ rfp });
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
                  <ChainOfThoughtCard title="Creating Proposal">
                    <ChainOfThoughtStep
                      stepNumber={1}
                      title="Analyzing RFP Requirements"
                      status="completed"
                      content={<RfpAnalysisDisplay analysis={analysis} />}
                    />
                    <ChainOfThoughtStep
                      stepNumber={2}
                      title="Mapping Requirements to Products"
                      status="error"
                      error={errorMessage}
                    />
                    <ChainOfThoughtStep
                      stepNumber={3}
                      title="Calculating Pricing"
                      status="pending"
                    />
                    <ChainOfThoughtStep
                      stepNumber={4}
                      title="Generating Final Proposal"
                      status="pending"
                    />
                  </ChainOfThoughtCard>
                }
              />
            );
          }

          // Extract mapping information
          const mapping = {
            template: proposalPayload.title_md || "Conference Template",
            selectedProducts: proposalPayload.blocks?.map((block: any, index: number) => ({
              name: `Product ${index + 1}`,
              contentId: block.content_id || "N/A",
            })) || [],
            selectedAttachments: proposalPayload.attachments?.map((att: any) => ({
              name: att.name || "Attachment",
              url: att.url || "",
            })) || [],
          };

          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 800));

          // Step 2 Complete: Show Requirements Mapping
          yield (
            <Message
              role="assistant"
              content={
                <ChainOfThoughtCard title="Creating Proposal">
                  <ChainOfThoughtStep
                    stepNumber={1}
                    title="Analyzing RFP Requirements"
                    status="completed"
                    content={<RfpAnalysisDisplay analysis={analysis} />}
                  />
                  <ChainOfThoughtStep
                    stepNumber={2}
                    title="Mapping Requirements to Products"
                    status="completed"
                    content={<RequirementsMappingDisplay mapping={mapping} />}
                  />
                  <ChainOfThoughtStep
                    stepNumber={3}
                    title="Calculating Pricing"
                    status="in_progress"
                  />
                  <ChainOfThoughtStep
                    stepNumber={4}
                    title="Generating Final Proposal"
                    status="pending"
                  />
                </ChainOfThoughtCard>
              }
            />
          );

          // Step 3: Calculate estimated pricing
          const estimatedPricing = {
            items: [
              { name: "Meeting Room", quantity: analysis.meetingDays || 1, unitPrice: 500, total: (analysis.meetingDays || 1) * 500 },
              { name: "Accommodation", quantity: analysis.rooms || 0, unitPrice: 150, total: (analysis.rooms || 0) * 150 },
              ...(analysis.catering ? [{ name: "Catering", quantity: analysis.attendees || 0, unitPrice: 45, total: (analysis.attendees || 0) * 45 }] : []),
            ],
            subtotal: 0,
            tax: 0,
            total: 0,
          };

          estimatedPricing.subtotal = estimatedPricing.items.reduce((sum, item) => sum + (item.total || 0), 0);
          estimatedPricing.tax = estimatedPricing.subtotal * 0.1;
          estimatedPricing.total = estimatedPricing.subtotal + estimatedPricing.tax;

          await new Promise(resolve => setTimeout(resolve, 800));

          // Step 3 Complete: Show Pricing Calculation
          yield (
            <Message
              role="assistant"
              content={
                <ChainOfThoughtCard title="Creating Proposal">
                  <ChainOfThoughtStep
                    stepNumber={1}
                    title="Analyzing RFP Requirements"
                    status="completed"
                    content={<RfpAnalysisDisplay analysis={analysis} />}
                  />
                  <ChainOfThoughtStep
                    stepNumber={2}
                    title="Mapping Requirements to Products"
                    status="completed"
                    content={<RequirementsMappingDisplay mapping={mapping} />}
                  />
                  <ChainOfThoughtStep
                    stepNumber={3}
                    title="Calculating Pricing"
                    status="completed"
                    content={
                      <PricingCalculationDisplay
                        items={estimatedPricing.items}
                        subtotal={estimatedPricing.subtotal}
                        tax={estimatedPricing.tax}
                        total={estimatedPricing.total}
                      />
                    }
                  />
                  <ChainOfThoughtStep
                    stepNumber={4}
                    title="Generating Final Proposal"
                    status="in_progress"
                  />
                </ChainOfThoughtCard>
              }
            />
          );

          // Step 4: Create proposal via API
          try {
            const { headers, apiBaseUrl } = getProposalesApiConfig();

            const response = await fetch(`${apiBaseUrl}/v3/proposals`, {
              method: "POST",
              headers,
              body: JSON.stringify(proposalPayload),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Failed to create: ${response.status} ${response.statusText} - ${errorText}`,
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
                  <ChainOfThoughtCard title="Creating Proposal">
                    <ChainOfThoughtStep
                      stepNumber={1}
                      title="Analyzing RFP Requirements"
                      status="completed"
                      content={<RfpAnalysisDisplay analysis={analysis} />}
                    />
                    <ChainOfThoughtStep
                      stepNumber={2}
                      title="Mapping Requirements to Products"
                      status="completed"
                      content={<RequirementsMappingDisplay mapping={mapping} />}
                    />
                    <ChainOfThoughtStep
                      stepNumber={3}
                      title="Calculating Pricing"
                      status="completed"
                      content={
                        <PricingCalculationDisplay
                          items={estimatedPricing.items}
                          subtotal={estimatedPricing.subtotal}
                          tax={estimatedPricing.tax}
                          total={estimatedPricing.total}
                        />
                      }
                    />
                    <ChainOfThoughtStep
                      stepNumber={4}
                      title="Generating Final Proposal"
                      status="completed"
                      content={
                        <ProposalCreateSuccessCard
                          uuid={data.proposal?.uuid}
                          url={data.proposal?.url}
                        />
                      }
                    />
                  </ChainOfThoughtCard>
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
                  <ErrorCard message={errorMessage} context="Error creating proposal" />
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
