"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export type StepStatus = "pending" | "in_progress" | "completed" | "error";

interface ChainOfThoughtStepProps {
  stepNumber: number;
  title: string;
  status: StepStatus;
  content?: ReactNode;
  error?: string;
}

export function ChainOfThoughtStep({
  stepNumber,
  title,
  status,
  content,
  error,
}: ChainOfThoughtStepProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return (
          <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
        );
      case "in_progress":
        return (
          <motion.div
            className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );
      case "completed":
        return (
          <motion.div
            className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        );
      case "error":
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "text-zinc-400 dark:text-zinc-600";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-zinc-700 dark:text-zinc-300";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center gap-2">
        {getStatusIcon()}
        {stepNumber < 4 && (
          <div className="w-0.5 h-full bg-zinc-200 dark:bg-zinc-700" />
        )}
      </div>
      <div className="flex-1 pb-6">
        <div className={`font-medium mb-2 ${getStatusColor()}`}>
          Step {stepNumber}: {title}
        </div>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}
        {content && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="text-sm"
          >
            {content}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
