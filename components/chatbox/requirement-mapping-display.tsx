interface RequirementsMappingDisplayProps {
  mapping: {
    selectedProducts?: Array<{ name: string; contentId: string }>;
    selectedAttachments?: Array<{ name: string; url: string }>;
    template?: string;
  };
}

export function RequirementsMappingDisplay({ mapping }: RequirementsMappingDisplayProps) {
  return (
    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
      {mapping.template && (
        <div className="mb-2">
          <span className="text-zinc-500 dark:text-zinc-400 text-sm">Template Selected:</span>
          <div className="font-medium text-zinc-900 dark:text-zinc-100 mt-1">
            {mapping.template}
          </div>
        </div>
      )}

      {mapping.selectedProducts && mapping.selectedProducts.length > 0 && (
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Products Mapped:
          </div>
          <div className="space-y-1">
            {mapping.selectedProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-900 p-2 rounded"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-zinc-700 dark:text-zinc-300">{product.name}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                  ID: {product.contentId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mapping.selectedAttachments && mapping.selectedAttachments.length > 0 && (
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Attachments Added:
          </div>
          <div className="space-y-1">
            {mapping.selectedAttachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-900 p-2 rounded"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-zinc-700 dark:text-zinc-300">{attachment.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
