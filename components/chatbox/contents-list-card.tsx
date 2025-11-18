import { getStringValue } from "@/lib/utils";

interface ContentItem {
  uuid?: string;
  id?: string;
  title?: any;
  name?: any;
  description?: any;
}

interface ContentListCardProps {
  items: ContentItem[];
}

export function ContentListCard({ items }: ContentListCardProps) {
  return (
    <div className="space-y-3">
      <div className="font-semibold">Content List</div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => {
            const title = getStringValue(item.title);
            const name = getStringValue(item.name);
            const description = getStringValue(item.description);

            return (
              <div
                key={item.uuid || item.id || index}
                className="border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800"
              >
                {title && <div className="font-medium">{title}</div>}
                {name && <div className="font-medium">{name}</div>}
                {item.uuid && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    UUID: {item.uuid}
                  </div>
                )}
                {description && (
                  <div className="text-sm mt-2 text-zinc-600 dark:text-zinc-300">
                    {description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          No content items found
        </div>
      )}
      <div className="text-xs text-zinc-400 dark:text-zinc-500">
        Total items: {items.length}
      </div>
    </div>
  );
}
