import ReactMarkdown from "react-markdown";
import { ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchContributors(modelId: string): Promise<{
  dataSource: string;
  contributorsContent: ReactNode;
}> {
  const response = await fetch(
    `https://storage.googleapis.com/wildflow/${modelId}/contributors.md`
    // "/contributors.md"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch contributors data");
  }

  const text = await response.text();
  const lines = text.split("\n");
  const contributorsText = lines.slice(1).join("\n");

  const MarkdownContent = () => (
    <ReactMarkdown
      components={{
        h1: ({ ...props }) => (
          <h1 className="text-2xl font-bold mb-4" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2 className="text-xl font-semibold mb-3" {...props} />
        ),
        p: ({ ...props }) => <p className="mb-4" {...props} />,
        ul: ({ ...props }) => (
          <ul className="list-disc list-inside mb-4" {...props} />
        ),
        li: ({ ...props }) => <li className="mb-1" {...props} />,
        a: ({ ...props }) => (
          <a className="text-blue-500 hover:underline" {...props} />
        ),
      }}
    >
      {contributorsText}
    </ReactMarkdown>
  );

  return {
    dataSource: lines[0],
    contributorsContent: <MarkdownContent />,
  };
}
