interface RfpAnalysisDisplayProps {
  rfp: any;
  analysis: {
    attendees?: number;
    meetingDays?: number;
    rooms?: number;
    eventType?: string;
    catering?: boolean;
    meetingSpaces?: boolean;
    startDate?: string;
    endDate?: string;
  };
}

export function RfpAnalysisDisplay({ rfp, analysis }: RfpAnalysisDisplayProps) {
  return (
    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
      <div className="font-medium text-zinc-900 dark:text-zinc-100">
        Requirements Extracted:
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {analysis.eventType && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">Event Type</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.eventType}
            </span>
          </div>
        )}
        {analysis.attendees && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">Attendees</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.attendees} people
            </span>
          </div>
        )}
        {analysis.meetingDays && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">Meeting Days</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.meetingDays} days
            </span>
          </div>
        )}
        {analysis.rooms && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">Rooms Needed</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.rooms} rooms
            </span>
          </div>
        )}
        {analysis.startDate && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">Start Date</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.startDate}
            </span>
          </div>
        )}
        {analysis.endDate && (
          <div className="flex flex-col">
            <span className="text-zinc-500 dark:text-zinc-400">End Date</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {analysis.endDate}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {analysis.catering && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
            Catering Required
          </span>
        )}
        {analysis.meetingSpaces && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
            Meeting Spaces Required
          </span>
        )}
      </div>
    </div>
  );
}
