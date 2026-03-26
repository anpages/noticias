"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface SearchResult {
  feedUrl: string;
  title: string;
  website: string;
  description: string;
  icon: string | null;
  subscribers: number;
}

export function AddFeedForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/feeds/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleAdd(feedUrl: string) {
    setError(null);
    setAdding(feedUrl);
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feedUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error añadiendo el feed");
        return;
      }
      setQuery("");
      setResults([]);
      setShowResults(false);
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch {
      setError("Error de conexión");
    } finally {
      setAdding(null);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setError(null);
  }

  return (
    <div ref={containerRef} className="px-3 pb-3 relative">
      {/* Search input */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(null); setShowResults(true); }}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder="Buscar feeds..."
          className={cn(
            "w-full text-sm pl-8 pr-8 py-1.5 rounded-md border",
            "bg-white dark:bg-neutral-900",
            "text-neutral-900 dark:text-neutral-100",
            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            error
              ? "border-red-400 dark:border-red-600"
              : "border-neutral-200 dark:border-neutral-700"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Search results dropdown */}
      {showResults && (query.trim().length >= 2) && (
        <div
          className="absolute left-3 right-3 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg dark:shadow-black/50 z-50 overflow-hidden"
          style={{ maxHeight: 280, overflowY: "auto" }}
        >
          {searching && results.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-400">
              <Loader2 size={14} className="animate-spin" /> Buscando...
            </div>
          )}

          {!searching && results.length === 0 && query.trim().length >= 2 && (
            <div className="py-4 text-center text-sm text-neutral-400 dark:text-neutral-500">
              Sin resultados para &quot;{query.trim()}&quot;
            </div>
          )}

          {results.map((r) => (
            <div
              key={r.feedUrl}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
            >
              <span className="shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center">
                {r.icon ? (
                  <Image
                    src={r.icon}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <Search size={12} className="text-neutral-300 dark:text-neutral-600" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {r.title || r.website || r.feedUrl}
                </p>
                {r.description && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                    {r.description}
                  </p>
                )}
                {r.website && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-600 truncate mt-0.5">
                    {r.website.replace(/^https?:\/\//, "")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAdd(r.feedUrl)}
                disabled={adding !== null}
                className="shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
                title="Añadir feed"
              >
                {adding === r.feedUrl
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Plus size={13} />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
