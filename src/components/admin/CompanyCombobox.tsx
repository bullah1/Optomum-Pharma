import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface CompanyComboboxProps {
  value: string;
  onChange: (val: string) => void;
  companies: string[];
}

const CompanyCombobox = ({ value, onChange, companies }: CompanyComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = companies.filter(c => c.toLowerCase().includes(search.toLowerCase())).slice(0, 20);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Company / Brand"
          className="w-full px-4 py-3 pr-16 rounded-2xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button type="button" onClick={() => { onChange(""); setSearch(""); }} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
              <X size={12} />
            </button>
          )}
          <ChevronDown size={14} className="text-muted-foreground" />
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setSearch(c); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors ${c === value ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyCombobox;
