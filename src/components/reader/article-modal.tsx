"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import type { Article } from "@/hooks/use-articles";

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  fontSize?: number;
}

export function ArticleModal({ article, onClose, fontSize = 14 }: ArticleModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retries, setRetries] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Push a history entry so the back button closes the modal
  useEffect(() => {
    if (!article) return;
    history.pushState({ modal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = "";
    };
  }, [article, onClose]);

  // Fetch content whenever article changes
  useEffect(() => {
    if (!article) { setContent(null); return; }
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setContent(null);
    setFailed(false);
    setRetries(0);
    setLoading(true);
    fetch(`/api/articles/${article.id}/content`)
      .then((r) => r.json())
      .then((d) => { setContent(d.content ?? null); if (!d.content) setFailed(true); })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [article?.id]);

  if (!article) return null;

  function handleClose() {
    history.back(); // pops the modal history entry → triggers onPop → onClose
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50 }}
      className="bg-white dark:bg-neutral-950 flex flex-col animate-modal-enter"
    >
      {/* Sticky header */}
      <header className="shrink-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0"
            >
              <ExternalLink size={13} />
              Original
            </a>
          )}
        </div>
      </header>

      {/* Scrollable body */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", "--reader-fs": `${fontSize}px` } as React.CSSProperties}>
        <div className="max-w-2xl mx-auto px-4 py-8 pb-16">
          {/* Meta */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            {article.feedTitle && <span>{article.feedTitle}</span>}
            {article.publishedAt && (
              <>
                <span aria-hidden>·</span>
                <span>{formatRelativeDate(article.publishedAt)}</span>
              </>
            )}
            {article.author && (
              <>
                <span aria-hidden>·</span>
                <span>{article.author}</span>
              </>
            )}
          </p>

          {/* Title */}
          <h1 style={{ fontSize: `calc(var(--reader-fs, 14px) * 1.7)` }} className="font-bold text-neutral-900 dark:text-neutral-100 leading-snug mb-6">
            {article.title}
          </h1>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={20} className="animate-spin text-blue-500" />
              <span className="text-sm text-neutral-400 dark:text-neutral-500">Cargando contenido...</span>
            </div>
          ) : content ? (
            <div
              style={{ fontSize: "var(--reader-fs, 14px)" }}
              className="prose prose-neutral dark:prose-invert max-w-none prose-img:rounded-lg prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-headings:font-bold prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Summary fallback — show if available */}
              {article.summary && (
                <p style={{ fontSize: "var(--reader-fs, 14px)" }}
                  className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {article.summary}
                </p>
              )}

              <div className={`flex flex-col items-center gap-3 text-center ${article.summary ? "pt-2 border-t border-neutral-100 dark:border-neutral-800" : "py-12"}`}>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {retries > 0
                    ? "El sitio no permite leer el contenido desde aquí."
                    : "No se pudo cargar el contenido completo."}
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  {retries < 2 && (
                    <button
                      onClick={() => {
                        setFailed(false);
                        setRetries((r) => r + 1);
                        setLoading(true);
                        fetch(`/api/articles/${article.id}/content`)
                          .then((r) => r.json())
                          .then((d) => { setContent(d.content ?? null); if (!d.content) setFailed(true); })
                          .catch(() => setFailed(true))
                          .finally(() => setLoading(false));
                      }}
                      className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    >
                      <RefreshCw size={12} /> Reintentar
                    </button>
                  )}
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      <ExternalLink size={14} />
                      Abrir artículo original
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
