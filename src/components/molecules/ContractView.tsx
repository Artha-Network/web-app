import { FC, useMemo } from "react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";

interface ContractViewProps {
  contract: string;
  className?: string;
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "article", "section", "header", "footer", "div", "span",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "strong", "em", "b", "i", "u", "small", "mark",
    "blockquote", "code", "pre",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "a",
  ],
  ALLOWED_ATTR: ["class", "href", "target", "rel"],
};

const stripCodeFence = (s: string) => {
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  return fence ? fence[1] : s;
};

const ContractView: FC<ContractViewProps> = ({ contract, className }) => {
  const wrapperClass = `prose dark:prose-invert max-w-none contract-view ${className ?? ""}`;

  const { isHtml, sanitized } = useMemo(() => {
    if (!contract) return { isHtml: false, sanitized: "" };
    const unfenced = stripCodeFence(contract).trim();
    const firstTagIdx = unfenced.search(/<[a-z!]/i);
    if (firstTagIdx < 0) return { isHtml: false, sanitized: "" };
    const html = unfenced.slice(firstTagIdx);
    return { isHtml: true, sanitized: DOMPurify.sanitize(html, SANITIZE_CONFIG) };
  }, [contract]);

  if (isHtml) {
    return (
      <div
        className={wrapperClass}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <div className={wrapperClass}>
      <ReactMarkdown>{contract}</ReactMarkdown>
    </div>
  );
};

export default ContractView;
