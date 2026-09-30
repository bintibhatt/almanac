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
        // Remap any accidental markdown H1 to H2 to ensure single H1 per page
        h1({ children, ...props }) {
          return (
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-10 mb-4 pb-2 border-b border-zinc-800" {...props}>
              {children}
            </h2>
          );
        },
        h2({ children, ...props }) {
          return (
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mt-10 mb-4 pb-2 border-b border-zinc-800" {...props}>
              {children}
            </h2>
          );
        },
        h3({ children, ...props }) {
          return (
            <h3 className="text-lg font-semibold tracking-tight text-zinc-200 mt-7 mb-3" {...props}>
              {children}
            </h3>
          );
        },
        p({ children, ...props }) {
          return (
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed my-4" {...props}>
              {children}
            </p>
          );
        },
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
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            );
          }

          return (
            <Link
              href={href}
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
              {...props}
            >
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
              className="rounded-lg border border-zinc-800 my-6"
              {...props}
            />
          );
        },
        table({ children }) {
          return (
            <div className="my-6 overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-xs sm:text-sm text-left">{children}</table>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
