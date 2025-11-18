import { generateProposalPayload } from "@/lib/proposal";
import { NextRequest, NextResponse } from "next/server";
import { validateRfp, getProposalesApiConfig } from "@/lib/proposal";

export async function POST(request: NextRequest) {
  try {
    const { rfp } = await request.json();

    if (!rfp) {
      return NextResponse.json({ error: "RFP is required" }, { status: 400 });
    }

    if (!validateRfp(rfp)) {
      return NextResponse.json({ error: "Invalid RFP" }, { status: 400 });
    }

    const proposalPayload = await generateProposalPayload({ rfp });

    const { headers, apiBaseUrl } = getProposalesApiConfig();

    const response = await fetch(`${apiBaseUrl}/v3/proposals`, {
      method: "POST",
      headers,
      body: JSON.stringify(proposalPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Failed to create proposal: ${response.status} ${response.statusText} - ${errorText}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      {
        error: `Failed to create proposal: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
