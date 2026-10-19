import DOMPurify from "dompurify";
import { useState } from "react";

interface ProductDescriptionCardProps {
  description: string;
  nameBn?: string | null;
  showBn: boolean;
  onToggleBn: () => void;
}

const ProductDescriptionCard = ({ description, nameBn, showBn, onToggleBn }: ProductDescriptionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isHtml = /<[a-z][\s\S]*>/i.test(description);
  const sanitized = isHtml ? DOMPurify.sanitize(description, { ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "h2", "h3", "a", "span"], ALLOWED_ATTR: ["href", "target", "rel"] }) : "";

  return (
    <div className="px-4 md:px-0 py-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] md:text-[16px] font-bold text-foreground">Product Details</h3>
        {nameBn && (
          <button
            onClick={onToggleBn}
            className="text-[10px] font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            {showBn ? "English" : "বাংলা"}
          </button>
        )}
      </div>
      <div className={`relative ${!expanded ? "max-h-[5em] overflow-hidden" : ""}`}>
        {isHtml ? (
          <div
            className="text-[12px] md:text-[14px] text-muted-foreground leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_strong]:text-foreground [&_a]:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        ) : (
          <p className="text-[12px] md:text-[14px] text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </p>
        )}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[12px] font-semibold text-primary mt-1.5 hover:underline"
      >
        {expanded ? "Read Less" : "Read More"} {expanded ? "▲" : "▼"}
      </button>
    </div>
  );
};

export default ProductDescriptionCard;
