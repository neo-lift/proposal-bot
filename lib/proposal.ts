import { openai } from "@ai-sdk/openai";
import { PROPOSALES_KNOWLEDGE_PACK } from "./knowledge";
import { GenerateProposalArgs, RfpInput } from "./types";
import { generateText } from "ai";
import proposalSystemPrompt from "@/prompts/proposal-system-prompt.txt?raw";
import { z } from "zod";

export function getProposalesApiConfig() {
  const apiKey = process.env.PROPOSAL_API_KEY;
  const companyId = process.env.PROPOSAL_COMPANY_ID;
  const apiBaseUrl =
    process.env.PROPOSAL_API_BASE_URL || "https://api.proposales.com";

  if (!apiKey) {
    throw new Error("PROPOSAL_API_KEY environment variable is not set");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (companyId) {
    headers["X-Company-Id"] = companyId;
  }

  return { headers, apiBaseUrl };
}

export async function generateProposalPayload(args: GenerateProposalArgs) {
  const { rfp } = args;

  const PROPOSAL_SYSTEM_PROMPT = proposalSystemPrompt;
  const response = await generateText({
    model: openai("gpt-4o"),
    system: PROPOSAL_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: JSON.stringify({ PROPOSALES_KNOWLEDGE_PACK, RFP: rfp }),
      },
    ],
  });

  const raw = response.text ?? "{}";

  // Should return a valid JSON object
  try {
    const proposalPayload = JSON.parse(raw);
    return proposalPayload;
  } catch (error) {
    console.error("Error parsing proposal payload:", error);
    throw new Error("Invalid proposal payload");
  }
}

export function validateRfp(rfp: RfpInput) {
  const schema = z.object({
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
    preferences: z
      .object({
        meetingSpaces: z.boolean().optional(),
        catering: z.boolean().optional(),
        tone: z.string().optional(),
        additionalBrief: z.string().optional(),
      })
      .optional(),
  });
  const result = schema.safeParse(rfp);

  if (!result.success) {
    console.error("Invalid RFP:", result.error);
    return false;
  }
  return true;
}
