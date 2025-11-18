// Helper function to safely extract string values from localized objects
export function getStringValue(value: any): string | null {
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
