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

const ContractView: FC<ContractViewProps> = ({ contract, className }) => {
  const isHtml = useMemo(() => /^\s*<[a-z!]/i.test(contract), [contract]);

  const sanitized = useMemo(
    () => (isHtml ? DOMPurify.sanitize(contract, SANITIZE_CONFIG) : ""),
    [contract, isHtml]
  );

  const wrapperClass = `prose dark:prose-invert max-w-none contract-view ${className ?? ""}`;

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
