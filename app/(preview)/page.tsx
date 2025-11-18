"use client";

import { ReactNode, useRef, useState } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { motion } from "framer-motion";
import Link from "next/link";
import type { AI } from "./ai-action";

type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type TokenUsageEntry = TokenUsage & {
  turn: number;
};

export default function Home() {
  const { sendMessage } = useActions<typeof AI>();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);
  const [usageEntries, setUsageEntries] = useState<Array<TokenUsageEntry>>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    {
      title: "List",
      label: "all content",
      action: "List all content",
    },
    {
      title: "List",
      label: "all companies",
      action: "List all companies",
    },
    {
      title: "Create",
      label: "a new proposal",
      action: "Create a new proposal",
    },
    {
      title: "View",
      label: "a proposal by UUID",
      action: "View a proposal",
    },
  ];

  const recordUsage = (usage: TokenUsage | null | undefined) => {
    if (!usage) return;
    setUsageEntries((entries) => [
      ...entries,
      {
        ...usage,
        turn: entries.length + 1,
      },
    ]);
  };

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-3 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && (
            <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
              <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
                <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50 text-lg font-semibold">
                  Proposales™
                </p>
                <p>
                  Proposales™ is a web-powered standard to create, send and e-sign proposals & contracts.
                </p>
                <p>
                  The standard uses a JSON schema which means 100% structured data at all times.
                </p>
                <p>
                  Explore our modern APIs & webhooks, enabling you to build automated workflows and send data to any system.
                </p>
                <p>
                  {" "}
                  Learn more about{" "}
                  <Link
                    className="text-blue-500 dark:text-blue-400"
                    href="https://docs.proposales.com/introduction"
                    target="_blank"
                  >
                    Proposales documentation
                  </Link>
                  .
                </p>
              </div>
            </motion.div>
          )}
          {messages.map((message) => message)}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px] mb-4">
          {messages.length === 0 &&
            suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.01 * index }}
                key={index}
                className={index > 1 ? "hidden sm:block" : "block"}
              >
                <button
                  onClick={async () => {
                    setMessages((messages) => [
                      ...messages,
                      <Message
                        key={messages.length}
                        role="user"
                        content={action.action}
                      />,
                    ]);
                    const response = await sendMessage(action.action);
                    setMessages((messages) => [...messages, response.ui]);
                    recordUsage(response.usage);
                  }}
                  className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium">{action.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {action.label}
                  </span>
                </button>
              </motion.div>
            ))}
        </div>

        <form
          className="flex flex-col gap-2 relative items-center"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!input.trim()) {
              return;
            }

            setMessages((messages) => [
              ...messages,
              <Message key={messages.length} role="user" content={input} />,
            ]);
            const currentInput = input;
            setInput("");

            const response = await sendMessage(currentInput);
            setMessages((messages) => [...messages, response.ui]);
            recordUsage(response.usage);
          }}
        >
          <input
            ref={inputRef}
            className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
          />
        </form>

        {usageEntries.length > 0 && (
          <div className="w-full px-4 md:px-0 mx-auto md:max-w-[500px]">
            <div className="border rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 p-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-3">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Token usage per chat
              </div>
              <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-700">
                {usageEntries.map((entry, index) => (
                  <div
                    key={`usage-${entry.turn}`}
                    className={`flex flex-col gap-1 py-2 ${index === 0 ? "pt-0" : ""} ${index === usageEntries.length - 1 ? "pb-0" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Chat {entry.turn}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {entry.totalTokens.toLocaleString()} tokens
                      </span>
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      prompt {entry.promptTokens.toLocaleString()} · completion{" "}
                      {entry.completionTokens.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
