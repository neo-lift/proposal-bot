const sampleRfps = [
  {
    customer: {
      customerName: "Emma Lindberg",
      customerEmail: "emma.lindberg@northstarconsulting.com",
      companyName: "NorthStar Consulting",
    },
    event: {
      eventType: "corporate_meeting",
      startDate: "2024-09-12",
      endDate: "2024-09-13",
      guestCount: 40,
      roomsNeeded: 25,
    },
    preferences: {
      meetingSpaces: true,
      catering: true,
      tone: "professional",
      additionalBrief:
        "This is an annual strategy retreat for the leadership team. They require a bright meeting room for 40 people, two breakout rooms, and lunch served both days. Dinner is not required. Accommodation for 25 executives is needed. They require strong WiFi and a projector for presentations.",
    },
  },
  {
    customer: {
      customerName: "Lucas Meyer",
      customerEmail: "lucas@skygrid.io",
      companyName: "SkyGrid Technologies",
    },
    event: {
      eventType: "launch_event",
      startDate: "2024-10-05",
      endDate: "2024-10-05",
      guestCount: 120,
      roomsNeeded: 0,
    },
    preferences: {
      meetingSpaces: true,
      catering: true,
      tone: "energetic",
      additionalBrief:
        "SkyGrid is hosting a one-day product launch with 120 guests. They need a large conference room with stage lighting, cocktail-style standing tables, coffee service throughout the day, and a buffet dinner at the end. No accommodation required.",
    },
  },
  {
    customer: {
      customerName: "Dr. Helena Schmidt",
      customerEmail: "h.schmidt@medivision.org",
      companyName: "MediVision International",
    },
    event: {
      eventType: "conference",
      startDate: "2025-03-20",
      endDate: "2025-03-22",
      guestCount: 300,
      roomsNeeded: 150,
    },
    preferences: {
      meetingSpaces: true,
      catering: true,
      tone: "formal",
      additionalBrief:
        "This is a large-scale medical conference requiring a main plenary hall for 300 attendees, 5 breakout rooms for parallel sessions, full catering (breakfast, lunch, and coffee) for three days, welcome dinner on day 1 and gala dinner on day 2. 150 international delegates will require accommodation. Vegan and gluten-free options must be available.",
    },
  },
  {
    customer: {
      customerName: "David Wu",
      customerEmail: "david.wu@macrosoft.com",
      companyName: "Macrosoft",
    },
    event: {
      eventType: "team_offsite",
      startDate: "2024-05-03",
      endDate: "2024-05-05",
      guestCount: 18,
      roomsNeeded: 18,
    },
    preferences: {
      meetingSpaces: true,
      catering: false,
      tone: "informal",
      additionalBrief:
        "This offsite is for the engineering team. They need a meeting room for 20 people for workshops and code-alongs, plus comfortable breakout areas. They will organize their own meals but need coffee/tea and snacks available throughout the day. Each guest needs their own single room. No dinners requested.",
    },
  },
  {
    customer: {
      customerName: "Sarah Bennett",
      customerEmail: "sarah.bennett@example.com",
      companyName: "Private",
    },
    event: {
      eventType: "wedding",
      startDate: "2024-08-10",
      endDate: "2024-08-11",
      guestCount: 200,
      roomsNeeded: 80,
    },
    preferences: {
      meetingSpaces: false,
      catering: true,
      tone: "romantic",
      additionalBrief:
        "A two-day destination wedding for 200 guests. They require an outdoor ceremony setup, indoor dining hall for a formal dinner, vegan options for at least 20 guests, brunch for all attendees the next morning, and rooms for 80 guests. The design aesthetic should feel premium and elegant.",
    },
  },
];

export default sampleRfps;
