"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface ArticleContentProps {
  rssContent: string | null;
  articleUrl: string | null;
  articleId: string;
}

export function ArticleContent({ rssContent, articleUrl, articleId }: ArticleContentProps) {
  const [content, setContent] = useState<string | null>(rssContent);
  const [loading, setLoading] = useState(!rssContent && !!articleUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (rssContent || !articleUrl) return;

    setLoading(true);
    fetch(`/api/articles/${articleId}/content`)
      .then((r) => r.json())
      .then((data) => {
        if (data.content) setContent(data.content);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [rssContent, articleUrl, articleId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="animate-spin text-blue-500" />
        <span className="text-sm text-neutral-400 dark:text-neutral-500">Extrayendo contenido...</span>
      </div>
    );
  }

  if (content) {
    return (
      <div
        className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none prose-img:rounded-lg prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-headings:font-bold"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // No content — show fallback
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      {failed ? (
        <>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            No se pudo extraer el contenido del artículo.
          </p>
          <button
            onClick={() => {
              setFailed(false);
              setLoading(true);
              fetch(`/api/articles/${articleId}/content`)
                .then((r) => r.json())
                .then((data) => {
                  if (data.content) setContent(data.content);
                  else setFailed(true);
                })
                .catch(() => setFailed(true))
                .finally(() => setLoading(false));
            }}
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          No hay contenido disponible.
        </p>
      )}
      {articleUrl && (
        <a
          href={articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <ExternalLink size={14} />
          Abrir artículo original
        </a>
      )}
    </div>
  );
}
