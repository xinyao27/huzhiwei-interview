"use client";

import React from "react";
import remarkGfm from "remark-gfm";
import short from 'short-uuid';
import { CodeBlock } from "@/components/markdown/code-block";
import { MemoizedReactMarkdown } from "@/components/markdown/memoized-react-markdown";

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
      <MemoizedReactMarkdown
        components={{
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          a({ href, children, ...props }: any) {
            const childrenArray = React.Children.toArray(children);
            const childrenText = childrenArray
              .map((child) => child?.toString() ?? "")
              .join("");

            const cleanedText = childrenText.replace(/\[|\]/g, "");
            const isNumber = /^\d+$/.test(cleanedText);

            return isNumber ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                {...props}
                className="bg-mountain-meadow-100 hover:bg-mountain-meadow-100/80 dark:bg-colour-primary-800 dark:hover:bg-colour-primary-800/80 relative bottom-[6px] mx-0.5 rounded px-[5px] py-[2px] text-[8px] font-bold no-underline"
              >
                {children}
              </a>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                {...props}
                className="hover:underline"
              >
                {children}
              </a>
            );
          },

          code(props: any) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <CodeBlock
                key={short.generate()}
                language={(match && match[1]) || ""}
                value={String(children).replace(/\n$/, "")}
                {...rest}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {text}
      </MemoizedReactMarkdown>
    </div>
  );
} 