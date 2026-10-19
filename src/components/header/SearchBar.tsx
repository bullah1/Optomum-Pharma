import { Search, ChevronDown, X, Clock, Trash2, Pill } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SEARCH_HISTORY_KEY = "optimumpharmahlb_search_history";
const MAX_HISTORY = 8;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function addToSearchHistory(term: string) {
  const history = getSearchHistory().filter((h) => h !== term);
  history.unshift(term);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

interface SearchBarProps {
  variant: "desktop" | "mobile";
  scrolled?: boolean;
  onAddItem: (item: any) => void;
}

const SearchDropdown = ({
  results,
  loading,
  onSelect,
  onAddItem,
}: {
  results: any[] | undefined;
  loading: boolean;
  onSelect: () => void;
  onAddItem: (item: any) => void;
}) => {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-ios-lg z-50 overflow-hidden">
      {loading ? (
        <div className="py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-10 h-10 rounded-xl" delay={i * 80} />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 rounded-md" delay={i * 80 + 40} />
                <Skeleton className="h-2.5 w-1/2 rounded-md" delay={i * 80 + 80} />
              </div>
              <Skeleton className="h-7 w-14 rounded-xl" delay={i * 80 + 120} />
            </div>
          ))}
        </div>
      ) : !results?.length ? (
        <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {results.map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Pill size={18} className="text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.company}</p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <span className="text-sm font-bold text-foreground">৳ {item.price}</span>
                  {item.original_price && (
                    <span className="text-[10px] text-muted-foreground line-through block">৳ {item.original_price}</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddItem(item);
                  }}
                  aria-label={`Add ${item.name} to cart`}
                  className="border-2 border-primary text-primary bg-transparent text-xs font-semibold italic min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  ADD
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchBar = ({ variant, scrolled, onAddItem }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(getSearchHistory());

  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // ✅ Uses data seeded by useHomepageData — NO direct DB query
  const { data: categories } = useQuery<any[]>({
    queryKey: ["categories-all"],
    queryFn: () => [],
    enabled: false,
    staleTime: 5 * 60_000,
  });

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["search", debouncedQuery, selectedCategory?.id],
    queryFn: async () => {
      const q = debouncedQuery.trim();
      if (!q) return [];
      const { data, error } = await (supabase.rpc as any)("search_medicines", {
        q,
        cat_id: selectedCategory?.id || null,
        lim: 8,
        off: 0,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: debouncedQuery.trim().length >= 2,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchSelect = () => {
    if (searchQuery.trim().length >= 2) {
      addToSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
    }
    setShowResults(false);
    setSearchQuery("");
  };

  const handleHistoryClick = (term: string) => {
    setSearchQuery(term);
    setShowResults(true);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setSearchHistory([]);
  };

  const showSearchHistory = showResults && searchQuery.trim().length < 2 && searchHistory.length > 0;

  // Desktop category dropdown
  const DesktopCategoryDropdown = () => (
    <div className="relative" ref={categoryRef}>
      <button
        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
        aria-label="Select category"
        className="flex items-center gap-1.5 px-3.5 h-full min-h-[44px] text-xs font-semibold text-foreground border-r border-border shrink-0 hover:bg-secondary transition-colors"
      >
        {selectedCategory?.name || "All"}{" "}
        <ChevronDown size={12} className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
      </button>
      {showCategoryDropdown && categories && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-card rounded-2xl shadow-ios-lg z-[60] overflow-hidden animate-fade-up">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categories</p>
          </div>
          <ul className="py-1.5 max-h-80 overflow-y-auto">
            <li>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryDropdown(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  !selectedCategory ? "text-primary bg-primary/5 font-bold" : "text-foreground hover:bg-primary/5 hover:text-primary"
                }`}
              >
                <span className="font-medium">All</span>
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => {
                    setSelectedCategory({ id: cat.id, name: cat.name });
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    selectedCategory?.id === cat.id ? "text-primary bg-primary/5 font-bold" : "text-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {cat.icon && <span className="text-base">{cat.icon}</span>}
                  <span className="font-medium">{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Mobile category bottom sheet
  const MobileCategoryDropdown = () =>
    showCategoryDropdown ? (
      <>
        <div className="fixed inset-0 z-[60]" onClick={() => setShowCategoryDropdown(false)} />
        <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-xl shadow-ios-lg z-[70] overflow-hidden border border-border">
          <div className="max-h-[50vh] overflow-y-auto py-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowCategoryDropdown(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                !selectedCategory ? "text-primary bg-primary/5 font-bold" : "text-foreground active:bg-primary/5"
              }`}
            >
              <span className="font-medium">All</span>
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory({ id: cat.id, name: cat.name });
                  setShowCategoryDropdown(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                  selectedCategory?.id === cat.id ? "text-primary bg-primary/5 font-bold" : "text-foreground active:bg-primary/5"
                }`}
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    ) : null;

  const SearchHistoryDropdown = () =>
    showSearchHistory ? (
      <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-ios-lg z-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground">Recent Searches</p>
          <button onClick={handleClearHistory} aria-label="Clear search history" className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors min-w-[44px] min-h-[44px] justify-center">
            <Trash2 size={10} /> Clear
          </button>
        </div>
        <div className="py-1">
          {searchHistory.map((term, i) => (
            <button key={i} onClick={() => handleHistoryClick(term)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors">
              <Clock size={13} className="text-muted-foreground shrink-0" />
              <span className="truncate">{term}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

  if (variant === "mobile") {
    return (
      <div className={`px-4 relative transition-all duration-300 ${scrolled ? "pb-1.5" : "pb-2.5"}`} ref={searchRef}>
        <div className={`flex overflow-hidden bg-secondary/50 border border-border transition-all duration-300 relative ${scrolled ? "rounded-lg" : "rounded-xl"}`}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              aria-label="Select category"
              className="flex items-center gap-0.5 px-3 min-h-[44px] text-[11px] font-medium text-foreground border-r border-border shrink-0 hover:bg-secondary transition-colors"
            >
            {selectedCategory?.name || "All"} <ChevronDown size={10} className={`transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
          </button>
          <MobileCategoryDropdown />
          <input
            type="text"
            placeholder="Search medicines..."
            className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          <button aria-label="Search" className="bg-primary px-4 min-h-[44px] text-primary-foreground hover:bg-primary/90 transition-colors">
            <Search size={16} />
          </button>
        </div>
        {showResults && debouncedQuery.trim().length >= 2 && (
          <SearchDropdown results={searchResults} loading={searching} onSelect={handleSearchSelect} onAddItem={onAddItem} />
        )}
        <SearchHistoryDropdown />
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex-1 relative" ref={searchRef}>
      <div className="flex rounded-2xl overflow-hidden bg-secondary/60 border border-border">
        <DesktopCategoryDropdown />
        <input
          type="text"
          placeholder="Search for products..."
          className="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
        <button aria-label="Search" className="bg-primary px-5 min-h-[44px] text-primary-foreground hover:bg-primary/90 transition-colors rounded-r-2xl">
          <Search size={18} />
        </button>
      </div>
      {showResults && debouncedQuery.trim().length >= 2 && (
        <SearchDropdown results={searchResults} loading={searching} onSelect={handleSearchSelect} onAddItem={onAddItem} />
      )}
      <SearchHistoryDropdown />
    </div>
  );
};

export default SearchBar;
