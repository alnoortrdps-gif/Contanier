import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "صار في مشكلة بالتحميل. حدّث الصفحة.";
const RELOAD_KEY = "chunk-reload";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

function staleChunk(message: string) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module/i.test(message);
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message = errorMessage(error);
  const stale = staleChunk(message);
  useEffect(() => {
    if (!stale || typeof window === "undefined") return;
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }, [stale]);
  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">صار في مشكلة بالتحميل</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        {stale ? "الملف القديم ضل عالق. اضغط تحديث الصفحة." : message}
      </p>
      <button
        type="button"
        className="mt-2 h-12 rounded-2xl bg-zinc-900 px-5 text-base font-bold text-white"
        onClick={() => {
          sessionStorage.removeItem(RELOAD_KEY);
          window.location.reload();
        }}
      >
        تحديث الصفحة
      </button>
    </main>
  );
}