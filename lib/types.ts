export interface RfpInput {
  customer: {
    customerName: string;
    customerEmail: string;
    companyName?: string;
  };
  event: {
    eventType: string;
    startDate?: string;
    endDate?: string;
    guestCount?: number;
    roomsNeeded?: number;
  };
  preferences?: {
    meetingSpaces?: boolean;
    catering?: boolean;
    tone?: string;
    additionalBrief?: string;
  };
}

export interface GenerateProposalArgs {
  rfp: RfpInput;
  companyIdOverride?: number;
  languageOverride?: string;
}
