import { getStringValue } from "@/lib/utils";

interface Attachment {
  uuid?: string;
  id?: string;
  name?: any;
  filename?: any;
  type?: string;
  size?: number;
  url?: string;
}

interface AttachmentsListCardProps {
  attachments: Attachment[];
}

export function AttachmentsListCard({ attachments }: AttachmentsListCardProps) {
  return (
    <div className="space-y-3">
      <div className="font-semibold">Attachments List</div>
      {attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment, index) => {
            const name = getStringValue(attachment.name);
            const filename = getStringValue(attachment.filename);

            return (
              <div
                key={attachment.uuid || attachment.id || index}
                className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
              >
                {name && <div className="font-medium">{name}</div>}
                {filename && <div className="font-medium">{filename}</div>}
                {attachment.uuid && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    UUID: {attachment.uuid}
                  </div>
                )}
                {attachment.type && (
                  <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                    Type: {attachment.type}
                  </div>
                )}
                {attachment.size && (
                  <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">
                    Size: {attachment.size} bytes
                  </div>
                )}
                {attachment.url && (
                  <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View attachment
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          No attachments found
        </div>
      )}
      <div className="text-xs text-zinc-400 dark:text-zinc-500">
        Total attachments: {attachments.length}
      </div>
    </div>
  );
}
