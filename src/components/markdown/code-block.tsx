import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { FC, useState } from "react";

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: FC<CodeBlockProps> = ({ language, value }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative w-full font-mono bg-white dark:bg-zinc-50 border border-gray-200 dark:border-gray-300 rounded-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100">
        <span className="text-xs text-gray-600 dark:text-gray-700">{language}</span>
        <div className="flex items-center">
          {isCopied && (
            <span className="text-xs text-green-600 mr-2 transition-opacity">
              已复制
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${
              isCopied 
                ? "text-green-600 hover:text-green-700" 
                : "text-gray-600 hover:text-gray-900 dark:text-gray-700 dark:hover:text-gray-900"
            }`}
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">
              {isCopied ? "已复制" : "复制代码"}
            </span>
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-gray-800 dark:text-gray-900 bg-white dark:bg-gray-50">
        <code>{value}</code>
      </pre>
    </div>
  );
}; 