interface PricingItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

interface PricingCalculationDisplayProps {
  items: PricingItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
}

export function PricingCalculationDisplay({
  items,
  subtotal,
  tax,
  total,
  currency = "USD",
}: PricingCalculationDisplayProps) {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
      <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        Price Breakdown:
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-start text-sm bg-white dark:bg-zinc-900 p-2 rounded"
          >
            <div className="flex-1">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {item.name}
              </div>
              {item.quantity && item.unitPrice && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              )}
            </div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(item.total || item.unitPrice)}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3 space-y-2">
        {subtotal !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Subtotal:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(subtotal)}
            </span>
          </div>
        )}
        {tax !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Tax:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatCurrency(tax)}
            </span>
          </div>
        )}
        {total !== undefined && (
          <div className="flex justify-between text-base font-semibold border-t border-zinc-200 dark:border-zinc-700 pt-2">
            <span className="text-zinc-900 dark:text-zinc-100">Total:</span>
            <span className="text-green-600 dark:text-green-400">
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
