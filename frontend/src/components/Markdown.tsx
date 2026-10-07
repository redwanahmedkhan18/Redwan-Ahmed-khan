import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Safe Markdown renderer: react-markdown escapes HTML by default (no raw HTML
 * injection), links are hardened below. Used for case studies / blog content.
 */
export default function Markdown({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`prose-technical ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => {
            const external = typeof props.href === "string" && /^https?:\/\//.test(props.href);
            return (
              <a
                {...props}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
