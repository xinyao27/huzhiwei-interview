"use client";

import React from "react";
import remarkGfm from "remark-gfm";
import short from 'short-uuid';
import { CodeBlock } from "@/components/markdown/code-block";
import { MemoizedReactMarkdown } from "@/components/markdown/memoized-react-markdown";

// 处理可能包含转义换行符的Markdown文本
function preprocessMarkdown(text: string): string {
  // 首先检查是否包含可能的代码块标记
  if (text.includes('```')) {
    // 正则表达式匹配代码块 ```language ... ```
    const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
    
    // 替换所有代码块，确保代码块内部格式正确
    return text.replace(codeBlockRegex, (match, language, codeContent) => {
      // 1. 替换所有的\n为真实换行
      let processedCode = codeContent.replace(/\\n/g, '\n');
      
      // 2. 检测代码块是否缺少初始换行 (例如 ```javascript function...)
      if (!processedCode.startsWith('\n')) {
        processedCode = '\n' + processedCode;
      }
      
      // 3. 检测代码行之间是否缺少换行
      // 通常代码块中的每行代码都应该有换行符
      // 如果检测到缺少换行符，我们尝试基于常见模式添加它们
      
      // 常见情况：函数定义后缺少换行
      processedCode = processedCode.replace(/\{(?!\s*\n)/g, '{\n');
      
      // 语句结束后缺少换行 (针对JavaScript等使用分号的语言)
      processedCode = processedCode.replace(/;(?!\s*\n)/g, ';\n');
      
      // 查找可能是单独行但缺少换行的情况 (例如 const arr = [5, 3...])
      // 替换常见代码行开始的模式，确保它们前面有换行
      const commonLineStarts = [
        'const ', 'let ', 'var ', 'function ', 'if ', 'for ', 'while ', 
        'return ', 'class ', 'import ', 'export ', '//', 'console.'
      ];
      
      for (const lineStart of commonLineStarts) {
        const pattern = new RegExp(`([^\\n])${lineStart}`, 'g');
        processedCode = processedCode.replace(pattern, `$1\n${lineStart}`);
      }
      
      // 4. 确保代码块结束前有换行
      if (!processedCode.endsWith('\n')) {
        processedCode = processedCode + '\n';
      }
      
      return '```' + language + processedCode + '```';
    });
  }
  
  // 对于不包含代码块的情况，替换所有\\n为真实换行
  if (text.includes('\\n')) {
    return text.replace(/\\n/g, '\n');
  }
  
  return text;
}

export default function Markdown({ text }: { text: string }) {
  // 预处理Markdown文本
  const processedText = preprocessMarkdown(text);

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
        {processedText}
      </MemoizedReactMarkdown>
    </div>
  );
} 