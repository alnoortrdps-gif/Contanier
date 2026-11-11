import { useState } from "react";
import { signIn } from "@/lib/auth/client";

export function GmailGate({ checking = false }: { checking?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter() {
    setError("");
    setBusy(true);
    try {
      await signIn("grok-google", { callbackURL: "/" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (/pop-up|popup|blocked/i.test(message)) {
        window.location.assign("/auth/popup?providerId=grok-google");
        return;
      }
      setError("ما انفتح جيميل. اسمح بالنوافذ المنبثقة، أو اضغط الزر الثاني.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 pt-8">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-3xl font-bold">الحاويات</h1>
        <p className="mt-3 text-base font-bold leading-7">ادخل بنفس حساب جيميل على التلفون والكمبيوتر. الفواتير تتزامن.</p>
        {checking ? <p className="mt-2 text-sm font-bold text-muted">جارٍ التحقق من الحساب…</p> : null}
        <button
          type="button"
          disabled={busy}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-pine text-base font-bold text-surface disabled:opacity-60"
          onClick={() => void enter()}
        >
          {busy ? "جارٍ فتح جيميل…" : "الدخول بحساب جيميل"}
        </button>
        <button
          type="button"
          className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl border border-line text-base font-bold"
          onClick={() => window.location.assign("/auth/popup?providerId=grok-google")}
        >
          فتح جيميل بنفس الصفحة
        </button>
        {error ? <p className="mt-3 text-sm font-bold text-danger">{error}</p> : null}
      </div>
    </main>
  );
}