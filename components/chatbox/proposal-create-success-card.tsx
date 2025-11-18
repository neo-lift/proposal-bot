
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
interface ProposalCreateSuccessCardProps {
  uuid?: string;
  url?: string;
}

export function ProposalCreateSuccessCard({
  uuid,
  url,
}: ProposalCreateSuccessCardProps) {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-green-600 dark:text-green-400">
        Proposal created successfully!
      </div>

      {uuid && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          UUID: {uuid}
        </div>
      )}
      {url && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400">View proposal</a>
          <FaArrowUpRightFromSquare className="size-4" />
        </div>
      )}
    </div>
  );
}
