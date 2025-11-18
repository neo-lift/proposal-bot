interface ErrorCardProps {
  message: string;
  context?: string;
}

export function ErrorCard({ message, context }: ErrorCardProps) {
  return (
    <div className="text-red-600 dark:text-red-400">
      {context ? `${context}: ${message}` : message}
    </div>
  );
}
