import { openai } from "@ai-sdk/openai";
import { PROPOSALES_KNOWLEDGE_PACK } from "./knowledge";
import { GenerateProposalArgs } from "./types";
import { generateText } from "ai";
import proposalSystemPrompt from "@/prompts/proposal-system-prompt.txt?raw";

export async function generateProposalPayload(args: GenerateProposalArgs) {
  const { rfp } = args;

  const PROPOSAL_SYSTEM_PROMPT = proposalSystemPrompt;
  const response = await generateText({
    model: openai("gpt-4o"),
    system: PROPOSAL_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: JSON.stringify({ PROPOSALES_KNOWLEDGE_PACK, RFP: rfp }) },
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