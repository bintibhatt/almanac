/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/CodeBlock";

function isExternalLink(href = "") {
  return /^https?:\/\//.test(href);
}

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeSlug,
        rehypeHighlight,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            properties: {
              className: ["heading-anchor"],
            },
          },
        ],
      ]}
      components={{
        pre({ children }) {
          const codeElement = Array.isArray(children) ? children[0] : children;
          const className = codeElement?.props?.className || "";

          return (
            <CodeBlock className={className}>
              {codeElement?.props?.children || children}
            </CodeBlock>
          );
        },
        code({ className, children, ...props }) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        a({ href = "", children, ...props }) {
          if (isExternalLink(href)) {
            return (
              <a href={href} target="_blank" rel="noreferrer" {...props}>
                {children}
              </a>
            );
          }

          return (
            <Link href={href} {...props}>
              {children}
            </Link>
          );
        },
        img({ alt = "", ...props }) {
          return (
            <img
              alt={alt}
              loading="lazy"
              decoding="async"
              className="rounded-lg border border-[var(--border)]"
              {...props}
            />
          );
        },
        table({ children }) {
          return (
            <div className="my-6 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table>{children}</table>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
