import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import * as proposalLib from "@/lib/proposal";

// Mock the proposal library
vi.mock("@/lib/proposal", async () => {
  const actual = await vi.importActual("@/lib/proposal");
  return {
    ...actual,
    generateProposalPayload: vi.fn(),
    getProposalesApiConfig: vi.fn(),
  };
});

// Mock fetch globally
global.fetch = vi.fn();

describe("/api/proposal POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default environment variables
    process.env.PROPOSAL_API_KEY = "test-api-key";
    process.env.PROPOSAL_COMPANY_ID = "test-company-id";
    process.env.PROPOSAL_API_BASE_URL = "https://api.test.com";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validRfp = {
    customer: {
      customerName: "John Doe",
      customerEmail: "john@example.com",
      companyName: "Test Corp",
    },
    event: {
      eventType: "Conference",
      startDate: "2024-01-15",
      endDate: "2024-01-17",
      guestCount: 100,
      roomsNeeded: 50,
    },
    preferences: {
      meetingSpaces: true,
      catering: true,
      tone: "professional",
      additionalBrief: "Need AV equipment",
    },
  };

  const mockProposalPayload = {
    company_id: 1,
    language: "en",
    contact_email: "sales@test.com",
    background_image: { id: 1, uuid: "bg-uuid" },
    title_md: "Test Proposal",
    description_md: "Test description",
    recipient: {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    },
    data: {},
    invoicing_enabled: true,
    blocks: [],
    attachments: [],
  };

  const mockApiResponse = {
    data: {
      uuid: "proposal-uuid-123",
      title: "Test Proposal",
      status: "draft",
    },
  };

  it("should create a proposal successfully", async () => {
    // Mock the proposal generation
    vi.mocked(proposalLib.generateProposalPayload).mockResolvedValue(
      mockProposalPayload
    );

    // Mock the API config
    vi.mocked(proposalLib.getProposalesApiConfig).mockReturnValue({
      headers: {
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
        "X-Company-Id": "test-company-id",
      },
      apiBaseUrl: "https://api.test.com",
    });

    // Mock the fetch response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: validRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockApiResponse);
    expect(proposalLib.generateProposalPayload).toHaveBeenCalledWith({
      rfp: validRfp,
    });
    expect(fetch).toHaveBeenCalledWith("https://api.test.com/v3/proposals", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
        "X-Company-Id": "test-company-id",
      },
      body: JSON.stringify(mockProposalPayload),
    });
  });

  it("should return 400 if RFP is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "RFP is required" });
  });

  it("should return 400 if RFP is invalid", async () => {
    const invalidRfp = {
      customer: {
        customerName: "",
        customerEmail: "invalid-email",
      },
      event: {
        eventType: "",
      },
    };

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: invalidRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Invalid RFP" });
  });

  it("should return 500 if proposal payload generation fails", async () => {
    vi.mocked(proposalLib.generateProposalPayload).mockRejectedValue(
      new Error("AI generation failed")
    );

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: validRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("AI generation failed");
  });

  it("should return 500 if Proposales API returns error", async () => {
    vi.mocked(proposalLib.generateProposalPayload).mockResolvedValue(
      mockProposalPayload
    );

    vi.mocked(proposalLib.getProposalesApiConfig).mockReturnValue({
      headers: {
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      },
      apiBaseUrl: "https://api.test.com",
    });

    // Mock failed API response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => "Invalid proposal data",
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: validRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to create proposal");
    expect(data.error).toContain("400 Bad Request");
  });

  it("should handle network errors gracefully", async () => {
    vi.mocked(proposalLib.generateProposalPayload).mockResolvedValue(
      mockProposalPayload
    );

    vi.mocked(proposalLib.getProposalesApiConfig).mockReturnValue({
      headers: {
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      },
      apiBaseUrl: "https://api.test.com",
    });

    // Mock network error
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: validRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Network error");
  });

  it("should validate all required RFP fields", async () => {
    const minimalRfp = {
      customer: {
        customerName: "John Doe",
        customerEmail: "john@example.com",
      },
      event: {
        eventType: "Conference",
      },
    };

    vi.mocked(proposalLib.generateProposalPayload).mockResolvedValue(
      mockProposalPayload
    );

    vi.mocked(proposalLib.getProposalesApiConfig).mockReturnValue({
      headers: {
        Authorization: "Bearer test-api-key",
        "Content-Type": "application/json",
      },
      apiBaseUrl: "https://api.test.com",
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const request = new NextRequest("http://localhost:3000/api/proposal", {
      method: "POST",
      body: JSON.stringify({ rfp: minimalRfp }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockApiResponse);
  });
});
