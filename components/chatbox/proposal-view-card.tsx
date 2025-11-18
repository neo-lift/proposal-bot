interface ProposalViewCardProps {
  title?: string;
  descriptionHtml?: string;
  status?: string;
  uuid: string;
}

export function ProposalViewCard({
  title,
  descriptionHtml,
  status,
  uuid,
}: ProposalViewCardProps) {
  return (
    <div className="space-y-2">
      <div className="font-semibold">{title || "Proposal"}</div>
      {descriptionHtml && (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: descriptionHtml,
          }}
        />
      )}
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Status: {status || "Unknown"} | UUID: {uuid}
      </div>
    </div>
  );
}
