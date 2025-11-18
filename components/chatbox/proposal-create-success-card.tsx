interface ProposalCreateSuccessCardProps {
  title?: string;
  uuid?: string;
  status?: string;
}

export function ProposalCreateSuccessCard({
  title,
  uuid,
  status,
}: ProposalCreateSuccessCardProps) {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-green-600 dark:text-green-400">
        Proposal created successfully!
      </div>
      {title && <div className="font-medium">{title}</div>}
      {uuid && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          UUID: {uuid}
        </div>
      )}
      {status && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Status: {status}
        </div>
      )}
    </div>
  );
}
