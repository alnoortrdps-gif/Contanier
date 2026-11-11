import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  addPayment,
  removePayment,
  createContainer,
  loadAccess,
  loadFileIndex,
  loadInvoiceFile,
  loadLedger,
  loadLog,
  loginRole,
  logoutRole,
  saveInvoiceFile,
  updateContainer,
  updateInvoice,
  type ContainerDraft,
  type InvoiceDraft,
} from "@/tracker/api";
import { compareArrival, invoiceArrival } from "@/tracker/excel";
import { trackingUrl } from "@/tracker/lines";
import {
  boxLabel,
  containerTypes,
  currencyWord,
  dayDiff,
  formatDate,
  money,
  paidSum,
  parseTypedDate,
  receivedAtCompany,
  remainingOf,
  todayISO,
  type Container,
  type ContainerStatus,
  type Currency,
  type Invoice,
  type Ledger,
  type Payment,
} from "@/tracker/model";
import { ROLE_TOKEN_KEY } from "@/tracker/role-token";

const field = "h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-pine";
const surfaceBtn = "inline-flex items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-bold";
const pineSolid = "inline-flex items-center justify-center rounded-xl bg-pine px-3 text-sm font-bold text-surface";

type Page = "home" | "sheet" | "find" | "archive" | "log";

function byNearest(a: string, b: string, _today: string) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

function markedReady(row: Invoice, containers: Container[]) {
  const box = boxOf(row, containers);
  return box?.status === "arrived" || box?.status === "delivered";
}

function monthTitle(month: string) {
  const names = ["", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const [year, value] = month.split("-");
  return `${names[Number(value)] || value} ${year}`;
}

function Inv({ children }: { children: string }) {
  return <span className="inv-no">{children}</span>;
}

function Num({ children }: { children: ReactNode }) {
  return <span className="tabular-nums">{children}</span>;
}

function boxOf(row: Invoice, containers: Container[]) {
  return containers.find((item) => item.number && item.number === row.containerNumber) ?? containers.find((item) => item.invoiceNumber === row.number) ?? null;
}

function archived(row: Invoice, containers: Container[]) {
  return receivedAtCompany(boxOf(row, containers));
}

function arrivalPassed(row: Invoice, containers: Container[], today: string) {
  const box = boxOf(row, containers);
  if (receivedAtCompany(box)) return false;
  if (box?.status === "arrived" || box?.status === "delivered") return true;
  const eta = invoiceArrival(row, containers);
  return Boolean(eta) && dayDiff(eta, today) <= 0;
}

function stateWord(row: Invoice, containers: Container[], today: string) {
  const box = boxOf(row, containers);
  const eta = invoiceArrival(row, containers);
  if (box?.status === "reserved") return "محجوزة";
  if (box?.status === "hold") return "معلّقة";
  if (!eta) return "بدون موعد";
  if (box?.status === "arrived" || box?.status === "delivered") return "جاهزة";
  const days = dayDiff(eta, today);
  if (days <= 0) return "عدّى الموعد";
  return `باقي ${days} يوم`;
}

function linkOf(row: Invoice, containers: Container[]) {
  const box = boxOf(row, containers);
  return box?.trackUrl || trackingUrl(row.containerNumber) || "";
}

const spanishNumbers = ["7", "8", "13", "14"] as const;
type PdfKind = "proforma" | "original" | "packing" | "telex";
const pdfKinds: { kind: PdfKind; label: string }[] = [
  { kind: "proforma", label: "بروفورما" },
  { kind: "original", label: "فاتورة أصلية" },
  { kind: "packing", label: "قائمة التعبئة" },
  { kind: "telex", label: "تيليكس" },
];

function isSpanishPaper(row: Invoice) {
  return row.number === "8" || row.number === "13" || row.number === "14";
}

function spanishSet(invoices: Invoice[]) {
  return spanishNumbers
    .map((number) => invoices.find((row) => row.number === number && row.category === "fish"))
    .filter((row): row is Invoice => Boolean(row));
}

export function Desk() {
  const [role, setRole] = useState<"admin" | "viewer" | null | "pending">("pending");
  const [username, setUsername] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [logs, setLogs] = useState<{ id: string; username: string; action: string; detail: string; createdAt: string }[]>([]);
  const [files, setFiles] = useState<{ invoiceId: string; kind: string; filename: string }[]>([]);
  const [page, setPage] = useState<Page>("home");
  const [toast, setToast] = useState("");
  const [loadError, setLoadError] = useState("");
  const [edit, setEdit] = useState<Invoice | null>(null);
  const [homeQuery, setHomeQuery] = useState(() => (typeof window !== "undefined" ? window.localStorage.getItem("marsa-home-query") ?? "" : ""));
  const [homeDueOnly, setHomeDueOnly] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("marsa-home-due") === "1");
  const [homeSort, setHomeSort] = useState<"arrival" | "remaining">(() => (typeof window !== "undefined" && window.localStorage.getItem("marsa-home-sort") === "remaining" ? "remaining" : "arrival"));
  const [homeOpen, setHomeOpen] = useState("");
  const [homePay, setHomePay] = useState("");
  const [archiveId, setArchiveId] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [printDue, setPrintDue] = useState(false);
  const [printDetail, setPrintDetail] = useState(false);
  const today = todayISO();
  const canEdit = role === "admin";

  async function refresh() {
    const data = await loadLedger();
    setLedger(data);
    const nextLogs = await loadLog().catch(() => []);
    setLogs(nextLogs);
    const nextFiles = await loadFileIndex().catch(() => []);
    setFiles(nextFiles);
  }

  useEffect(() => {
    void loadAccess()
      .then((access) => {
        if (!access.role) {
          setRole(null);
          return;
        }
        setRole(access.role);
        setUsername(access.username);
      })
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    if (role !== "admin" && role !== "viewer") return;
    setLoadError("");
    void refresh().catch((error) => setLoadError(error instanceof Error ? error.message : "تعذّر تحميل البيانات"));
  }, [role]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function printReport(due: boolean, detail = false) {
    setPrintDue(due);
    setPrintDetail(detail);
    window.setTimeout(() => window.print(), 250);
  }

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      await refresh();
      setToast(ok);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setToast(message.includes("Too small") || message.startsWith("[") ? "ما انحفظ. تأكد من رقم الفاتورة والمبلغ، ورقم الحاوية مش إجباري." : message || "تعذّر الحفظ");
    }
  }

  if (role === "pending") {
    return <main className="grid min-h-screen place-items-center"><p className="text-lg font-bold">جارٍ الفتح…</p></main>;
  }
  if (!role) {
    return <Login onDone={(name, next) => { setUsername(name); setRole(next); }} />;
  }
  if (!ledger) {
    return (
      <main className="grid min-h-screen place-items-center gap-3 px-6 text-center">
        <p className="text-lg font-bold">{loadError || "جارٍ تحميل الفواتير…"}</p>
        {loadError ? (
          <button type="button" className={pineSolid + " h-11 px-5"} onClick={() => { setLoadError(""); void refresh().catch((error) => setLoadError(error instanceof Error ? error.message : "تعذّر تحميل البيانات")); }}>
            حاول مرة ثانية
          </button>
        ) : null}
      </main>
    );
  }

  const invoices = ledger.invoices;
  const containers = ledger.containers;
  const payments = ledger.payments;
  const openRows = invoices.filter((row) => !archived(row, containers) && !isSpanishPaper(row));

  return (
    <div className="app-shell min-h-screen">
      <nav className="side-nav no-print" aria-label="الصفحات">
        <button type="button" className={page === "home" ? "on" : ""} onClick={() => setPage("home")}>الدفتر</button>
        {canEdit ? <button type="button" className={page === "find" ? "on" : ""} onClick={() => setPage("find")}>بحث</button> : null}
        {canEdit ? <button type="button" className={page === "archive" ? "on" : ""} onClick={() => setPage("archive")}>الأرشيف</button> : null}
        {canEdit ? <button type="button" className={page === "log" ? "on" : ""} onClick={() => setPage("log")}>السجل</button> : null}
        <button type="button" onClick={() => {
          void logoutRole().catch(() => undefined).finally(() => {
            window.sessionStorage.removeItem(ROLE_TOKEN_KEY);
            setRole(null);
            setLedger(null);
          });
        }}>خروج</button>
      </nav>
      <nav className="bottom-nav no-print" aria-label="الجوال">
        <button type="button" className={page === "home" ? "on" : ""} onClick={() => setPage("home")}>الدفتر</button>
        {canEdit ? <button type="button" className={page === "find" ? "on" : ""} onClick={() => setPage("find")}>بحث</button> : null}
        {canEdit ? <button type="button" className={page === "archive" ? "on" : ""} onClick={() => setPage("archive")}>الأرشيف</button> : null}
      </nav>
      <main className="mx-auto min-w-0 max-w-7xl px-4 pb-24 sm:px-6">
        <header className="app-head no-print py-4">
          <h1 className="text-3xl font-bold">الحاويات</h1>
          <p className="text-sm font-bold text-muted">{username}</p>
          {canEdit ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" className={cn(surfaceBtn, "h-12 px-4")} onClick={() => printReport(false)}>طباعة الكل</button>
              <button type="button" className={cn(pineSolid, "h-12 px-4")} onClick={() => printReport(true)}>طباعة الغير مدفوع فقط</button>
              <button type="button" className={cn(surfaceBtn, "h-12 px-4")} onClick={() => printReport(false, true)}>تفاصيل كل فاتورة</button>
            </div>
          ) : null}
        </header>
        {page === "home" && !canEdit ? (
          <ManagerBoard invoices={openRows} containers={containers} payments={payments} today={today} />
        ) : null}
        {page === "home" && canEdit ? (
          <Home
            invoices={openRows}
            all={invoices}
            containers={containers}
            payments={payments}
            today={today}
            canEdit={canEdit}
            homeQuery={homeQuery}
            setHomeQuery={setHomeQuery}
            homeDueOnly={homeDueOnly}
            setHomeDueOnly={setHomeDueOnly}
            homeSort={homeSort}
            setHomeSort={setHomeSort}
            homeOpen={homeOpen}
            setHomeOpen={setHomeOpen}
            homePay={homePay}
            setHomePay={setHomePay}
            archiveId={archiveId}
            setArchiveId={setArchiveId}
            onEdit={setEdit}
            onPay={(row, amount, paidOn) => run(async () => { await addPayment({ data: { invoiceId: row.id, amount, paidOn, note: "", receipt: "" } }); }, "تم تسجيل الدفعة")}
            onDeletePay={(id) => run(async () => { await removePayment({ data: { id } }); }, "تم حذف الدفعة")}
            onArchive={(row, customs) => {
              const box = boxOf(row, containers);
              if (!box) {
                setToast("ما في حاوية لهذه الفاتورة");
                return;
              }
              void run(async () => {
                await updateContainer({ data: { ...draftOf(box), id: box.id, customsNo: customs, atCompany: true, status: "delivered" } });
                setArchiveId("");
              }, "انتقلت للأرشيف");
            }}
            onReady={(row) => {
              const box = boxOf(row, containers);
              if (!box) {
                setToast("ما في حاوية لهذه الفاتورة");
                return;
              }
              void run(async () => {
                await updateContainer({ data: { ...draftOf(box), id: box.id, status: "arrived" } });
              }, "تم التعليم: جاهزة. الفاتورة بقيت بمكانها");
            }}
            onPrint={() => printReport(false)}
            onPrintDue={() => printReport(true)}
            printDue={printDue}
            setPrintDue={setPrintDue}
            setToast={setToast}
            files={files}
            onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)}
            onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")}
          />
        ) : null}
        {page === "sheet" ? (
          <div className="mt-4 flex flex-col gap-4">
            <Sheet title="عجل" invoices={openRows.filter((row) => row.category === "meat")} containers={containers} payments={payments} today={today} canEdit={canEdit} onEdit={setEdit} files={files} group={[]} onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)} onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")} />
            <Sheet title="سمك" invoices={openRows.filter((row) => row.category === "fish")} containers={containers} payments={payments} today={today} canEdit={canEdit} onEdit={setEdit} files={files} group={spanishSet(invoices)} onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)} onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")} />
          </div>
        ) : null}
        {page === "archive" ? (
          <Sheet
            title="الأرشيف"
            invoices={invoices.filter((row) => archived(row, containers))}
            containers={containers}
            payments={payments}
            today={today}
            canEdit={canEdit}
            onEdit={setEdit}
            files={files}
            group={spanishSet(invoices)}
            onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)}
            onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")}
          />
        ) : null}
        {page === "find" ? (
          <Find
            query={findQuery}
            setQuery={setFindQuery}
            invoices={invoices}
            containers={containers}
            payments={payments}
            today={today}
            canEdit={canEdit}
            onEdit={setEdit}
            onPay={(row) => setHomePay(row.id)}
            files={files}
            group={spanishSet(invoices)}
            onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)}
            onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")}
          />
        ) : null}
        {page === "log" ? (
          <section className="no-print mt-4 overflow-hidden rounded-2xl border-2 border-ink bg-surface">
            <h2 className="border-b border-line px-4 py-3 text-xl font-bold">آخر التحديثات</h2>
            {logs.length === 0 ? <p className="px-4 py-3 font-bold">ما في تعديلات بعد</p> : (
              <ul>
                {logs.map((row) => (
                  <li key={row.id} className="border-b border-line px-4 py-3 text-base font-bold last:border-0">
                    <span className="text-pine">{row.username}</span> · {row.action} · {row.detail}
                    <span className="mt-1 block text-sm text-muted"><Num>{formatDate(row.createdAt.slice(0, 10))}</Num></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </main>
      {canEdit && !printDetail ? <PrintSheet invoices={openRows} containers={containers} payments={payments} today={today} dueOnly={printDue} /> : null}
      {canEdit && printDetail ? <DetailPrint invoices={openRows} containers={containers} payments={payments} today={today} /> : null}
      {edit && canEdit ? (
        <Editor
          invoice={edit}
          box={boxOf(edit, containers)}
          files={files}
          paperRows={edit.number === "7" ? spanishSet(invoices) : [edit]}
          onOpenFile={(invoiceId, kind) => void openStored(invoiceId, kind, setToast)}
          onSaveFile={(invoiceId, kind, filename, data) => void run(async () => { await saveInvoiceFile({ data: { invoiceId, kind, filename, data } }); }, "تم حفظ الملف")}
          onClose={() => setEdit(null)}
          onSave={(invoiceDraft, containerDraft, containerId) => {
            void run(async () => {
              await updateInvoice({ data: { ...invoiceDraft, id: edit.id } });
              if (containerId) await updateContainer({ data: { ...containerDraft, id: containerId } });
              else if (containerDraft.number.trim() || containerDraft.atCompany) await createContainer({ data: containerDraft });
              setEdit(null);
            }, "تم حفظ الفاتورة");
          }}
        />
      ) : null}
      {toast ? <div className="fixed bottom-4 start-4 z-50 rounded-xl bg-ink px-4 py-3 text-sm text-surface">{toast}</div> : null}
    </div>
  );
}

function ManagerBoard({ invoices, containers, payments, today }: { invoices: Invoice[]; containers: Container[]; payments: Payment[]; today: string }) {
  const [book, setBook] = useState<"meat" | "fish">("meat");
  const [pay, setPay] = useState<"all" | "paid" | "due">("all");
  const visible = invoices.filter((row) => {
    const left = remainingOf(row, payments);
    const paid = row.amount > 0 && left < 5;
    if (pay === "paid") return paid;
    if (pay === "due") return row.amount > 0 && !paid;
    return true;
  });
  const meatCount = visible.filter((row) => row.category === "meat").length;
  const fishCount = visible.filter((row) => row.category === "fish").length;
  return (
    <div className="manager-view mt-2 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className={cn("h-14 rounded-2xl text-base font-bold", pay === "all" ? "bg-pine text-surface" : "bg-surface")} onClick={() => setPay("all")}>كل الفواتير</button>
        <button type="button" className={cn("h-14 rounded-2xl text-base font-bold", pay === "paid" ? "bg-pine text-surface" : "bg-surface")} onClick={() => setPay("paid")}>المدفوع</button>
        <button type="button" className={cn("h-14 rounded-2xl text-base font-bold", pay === "due" ? "bg-pine text-surface" : "bg-surface")} onClick={() => setPay("due")}>الغير مدفوع</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={cn("h-16 rounded-2xl text-2xl font-bold", book === "meat" ? "bg-pine text-surface" : "bg-surface")} onClick={() => setBook("meat")}>عجل · {meatCount}</button>
        <button type="button" className={cn("h-16 rounded-2xl text-2xl font-bold", book === "fish" ? "bg-pine text-surface" : "bg-surface")} onClick={() => setBook("fish")}>سمك · {fishCount}</button>
      </div>
      {(["meat", "fish"] as const).filter((key) => key === book).map((key) => {
        const rows = visible
          .filter((row) => row.category === key)
          .sort((a, b) => compareArrival(invoiceArrival(a, containers), invoiceArrival(b, containers)) || a.number.localeCompare(b.number));
        return (
          <section key={key} className="max-w-full rounded-3xl bg-surface shadow-sm">
            <h2 className="px-4 py-3 text-2xl font-bold">{key === "fish" ? "سمك" : "عجل"}</h2>
            {rows.length === 0 ? <p className="px-4 pb-4 text-lg font-bold">ما في فواتير</p> : (
              <>
                <div className="flex flex-col gap-3 px-3 pb-3 md:hidden">
                  {rows.map((row) => {
                    const left = remainingOf(row, payments);
                    const paidAmount = paidSum(row.id, payments);
                    const paid = row.amount > 0 && left < 5;
                    const eta = invoiceArrival(row, containers);
                    const tone = paid ? "bg-[#d9f0e4]" : paidAmount > 0 ? "bg-[#f8e6c8]" : row.amount > 0 ? "bg-[#f6d5d1]" : "bg-white";
                    const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
                    return (
                      <article key={row.id} className={cn("rounded-2xl border-2 border-black p-3", tone)}>
                        <p className="text-2xl font-bold"><Inv>{row.number === "7" ? "7 · 8 · 13 · 14" : row.number}</Inv></p>
                        <p className="text-lg font-bold">{row.product || "—"}</p>
                        <p className="font-bold">{row.importer || "—"} · {row.supplier || "—"}</p>
                        <p className="mt-1 font-bold"><Num>{eta ? formatDate(eta) : "بدون موعد"}</Num> · {stateWord(row, containers, today)}</p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm font-bold">
                          <p>الإجمالي<span className="mt-1 block text-base"><Num>{row.amount <= 0 ? "بدون مبلغ" : money(row.amount)}</Num></span></p>
                          <p>المدفوع<span className="mt-1 block text-base"><Num>{money(paidAmount)}</Num></span></p>
                          <p>المتبقي<span className={cn("mt-1 block text-base", paid || row.amount <= 0 ? "text-pine" : "text-danger")}>{row.amount <= 0 ? "بدون مبلغ" : paid ? "تم الدفع" : <Num>{money(left)}</Num>}</span></p>
                        </div>
                        <p className="mt-1 text-center text-sm font-bold">{currencyWord(row.currency)}</p>
                        <ul className="mt-2 border-t border-black pt-2 text-sm font-bold">
                          {pays.length === 0 ? <li>ما في دفعات</li> : pays.map((pay, payIndex) => <li key={pay.id}>دفعة {payIndex + 1}: <Num>{formatDate(pay.paidOn)} · {money(pay.amount)} {currencyWord(row.currency)}</Num></li>)}
                        </ul>
                      </article>
                    );
                  })}
                </div>
                <table className="manager-fit home-sheet hidden w-full border-collapse text-base font-bold md:table">
                  <thead>
                    <tr>
                      <th className="px-2 py-2">رقم الفاتورة</th>
                      <th className="px-2 py-2">الصنف</th>
                      <th className="px-2 py-2">المستورد</th>
                      <th className="px-2 py-2">المورد</th>
                      <th className="px-2 py-2">الإجمالي</th>
                      <th className="px-2 py-2">المدفوع</th>
                      <th className="px-2 py-2">المتبقي</th>
                      <th className="px-2 py-2">الوصول</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const left = remainingOf(row, payments);
                      const paidAmount = paidSum(row.id, payments);
                      const paid = row.amount > 0 && left < 5;
                      const eta = invoiceArrival(row, containers);
                      const tone = paid ? "home-paid" : paidAmount > 0 ? "home-part" : row.amount > 0 ? "home-open" : "";
                      const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
                      return (
                        <Fragment key={row.id}>
                          <tr className={tone}>
                          <td className="px-2 py-3"><Inv>{row.number === "7" ? "7 · 8 · 13 · 14" : row.number}</Inv></td>
                          <td className="px-2 py-3">{row.product || "—"}</td>
                          <td className="px-2 py-3">{row.importer || "—"}</td>
                          <td className="px-2 py-3">{row.supplier || "—"}</td>
                          <td className="px-2 py-3">{row.amount <= 0 ? "بدون مبلغ" : <Num>{money(row.amount)} {currencyWord(row.currency)}</Num>}</td>
                          <td className="px-2 py-3"><Num>{money(paidAmount)} {currencyWord(row.currency)}</Num></td>
                          <td className={cn("px-2 py-3", paid || row.amount <= 0 ? "text-pine" : "text-danger")}>{row.amount <= 0 ? "بدون مبلغ" : paid ? "تم الدفع" : <Num>{money(left)} {currencyWord(row.currency)}</Num>}</td>
                          <td className="px-2 py-3"><Num>{eta ? formatDate(eta) : "بدون موعد"}</Num><span className="mt-1 block">{stateWord(row, containers, today)}</span></td>
                        </tr>
                        <tr className={tone}>
                          <td colSpan={8} className="px-2 py-2 text-sm">
                            {pays.length === 0 ? "ما في دفعات" : pays.map((pay, payIndex) => <span key={pay.id} className="me-3">دفعة {payIndex + 1}: <Num>{formatDate(pay.paidOn)} · {money(pay.amount)} {currencyWord(row.currency)}</Num></span>)}
                          </td>
                        </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ManagerPrint({ invoices, containers, payments, today, dueOnly }: { invoices: Invoice[]; containers: Container[]; payments: Payment[]; today: string; dueOnly: boolean }) {
  const source = dueOnly ? invoices.filter((row) => row.amount > 0 && remainingOf(row, payments) >= 5) : invoices;
  const blocks = (["meat", "fish"] as const).map((key) => ({
    key,
    rows: source
      .filter((row) => row.category === key)
      .sort((a, b) => compareArrival(invoiceArrival(a, containers), invoiceArrival(b, containers)) || a.number.localeCompare(b.number)),
  })).filter((block) => block.rows.length);
  return (
    <section className="print-sheet manager-print text-ink">
      <header className="print-head">
        <p className="print-brand">الحاويات · {dueOnly ? "الغير مدفوع فقط" : "الفواتير كاملة"}</p>
        <p className="print-date">{formatDate(today)}</p>
      </header>
      {blocks.map((block) => (
        <div key={block.key}>
          <h2>{block.key === "fish" ? "سمك" : "عجل"}</h2>
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>رقم الفاتورة</th>
                <th>المورد / الشركة</th>
                <th>الصنف / ملاحظات</th>
                <th>المبلغ الإجمالي</th>
                <th>إجمالي المدفوع</th>
                <th>المبلغ المتبقي</th>
                <th>تاريخ الوصول المتوقع</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => {
                const left = remainingOf(row, payments);
                const paidAmount = paidSum(row.id, payments);
                const eta = invoiceArrival(row, containers);
                const note = [row.product, row.note].filter(Boolean).join(" — ");
                return (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.number === "7" ? "7 · 8 · 13 · 14" : row.number}</td>
                    <td>{row.supplier}</td>
                    <td>{note || "—"}</td>
                    <td>{row.amount <= 0 ? "بدون مبلغ" : `${money(row.amount)} ${currencyWord(row.currency)}`}</td>
                    <td>{money(paidAmount)} {currencyWord(row.currency)}</td>
                    <td className={left >= 5 ? "print-due" : "print-ok"}>{row.amount <= 0 ? "بدون مبلغ" : left < 5 ? "تم الدفع" : `${money(left)} ${currencyWord(row.currency)}`}</td>
                    <td>{eta ? `${formatDate(eta)} · ${stateWord(row, containers, today)}` : "بدون موعد"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function Login({ onDone }: { onDone: (username: string, role: "admin" | "viewer") => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const access = await loginRole({ data: { username, password } });
      window.sessionStorage.setItem(ROLE_TOKEN_KEY, access.token);
      onDone(access.username, access.role);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذّر الدخول");
    }
  }
  return (
    <main className="min-h-screen bg-bg px-4 pt-8">
      <form className="mx-auto w-full max-w-sm" onSubmit={(event) => void submit(event)}>
        <h1 className="text-3xl font-bold">الحاويات</h1>
        <label className="mt-5 block text-base font-bold text-danger">اسم المستخدم<input className={cn(field, "mt-1 text-base text-ink")} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus /></label>
        <label className="mt-3 block text-base font-bold text-danger">كلمة السر<input className={cn(field, "mt-1 text-base text-ink")} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error ? <p className="mt-3 text-sm font-bold text-danger">{error}</p> : null}
        <button type="submit" className={cn(pineSolid, "mt-4 h-12 w-full")}>دخول</button>
      </form>
    </main>
  );
}

function Home(props: {
  invoices: Invoice[];
  all: Invoice[];
  containers: Container[];
  payments: Payment[];
  today: string;
  canEdit: boolean;
  homeQuery: string;
  setHomeQuery: (value: string) => void;
  homeDueOnly: boolean;
  setHomeDueOnly: (value: boolean | ((value: boolean) => boolean)) => void;
  homeSort: "arrival" | "remaining";
  setHomeSort: (value: "arrival" | "remaining") => void;
  homeOpen: string;
  setHomeOpen: (value: string) => void;
  homePay: string;
  setHomePay: (value: string) => void;
  archiveId: string;
  setArchiveId: (value: string) => void;
  onEdit: (row: Invoice) => void;
  onPay: (row: Invoice, amount: number, paidOn: string) => void;
  onDeletePay: (id: string) => void;
  onArchive: (row: Invoice, customs: string) => void;
  onReady: (row: Invoice) => void;
  onPrint: () => void;
  onPrintDue: () => void;
  printDue: boolean;
  setPrintDue: (value: boolean) => void;
  setToast: (value: string) => void;
  files: { invoiceId: string; kind: string; filename: string }[];
  onOpenFile: (invoiceId: string, kind: PdfKind) => void;
  onSaveFile: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
}) {
  const { invoices, containers, payments, today } = props;
  const [book, setBook] = useState<"meat" | "fish">("meat");
  const needle = props.homeQuery.trim().toLowerCase();
  const rows = invoices.filter((row) => {
    if (row.category !== book) return false;
    if (needle && !`${row.number} ${row.containerNumber} ${row.supplier}`.toLowerCase().includes(needle)) return false;
    const over = row.amount > 0 && paidSum(row.id, payments) - row.amount > 0.009;
    if (props.homeDueOnly && !over && (row.amount <= 0 || remainingOf(row, payments) < 5)) return false;
    return true;
  }).sort((a, b) => byNearest(invoiceArrival(a, containers), invoiceArrival(b, containers), today) || a.number.localeCompare(b.number));
  const total = new Map<string, number>();
  for (const row of invoices) {
    if (row.category !== book) continue;
    const left = remainingOf(row, payments);
    if (row.amount <= 0 || left < 5) continue;
    total.set(row.currency, (total.get(row.currency) ?? 0) + left);
  }
  const nearest = rows
    .filter((row) => row.amount > 0 && remainingOf(row, payments) >= 5 && invoiceArrival(row, containers) && dayDiff(invoiceArrival(row, containers), today) >= 0)
    .sort((a, b) => compareArrival(invoiceArrival(a, containers), invoiceArrival(b, containers)))[0]
    ?? rows.find((row) => row.amount > 0 && remainingOf(row, payments) >= 5);
  const group = book === "fish" ? spanishSet(props.all) : [];
  function card(row: Invoice) {
    const eta = invoiceArrival(row, containers);
    const left = remainingOf(row, payments);
    const paidAmount = paidSum(row.id, payments);
    const paid = row.amount > 0 && left < 5;
    const tone = paid ? "bg-[#d9f0e4]" : paidAmount > 0 ? "bg-[#f8e6c8]" : row.amount > 0 ? "bg-[#f6d5d1]" : "bg-surface";
    const open = props.homeOpen === row.id;
    const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
    const lastPay = pays[pays.length - 1];
    return (
      <article key={row.id} className={cn("rounded-3xl border-2 border-black p-4", tone)} onClick={() => props.setHomeOpen(open ? "" : row.id)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-3xl font-bold"><Inv>{row.number}</Inv></p>
            <p className="mt-1 text-lg font-bold">{row.supplier}</p>
            <p className="font-bold">{row.importer} · {row.product}</p>
            {row.number === "7" ? <p className="text-sm font-bold">تشمل 8 و 13 و 14. الأوراق لكل رقم لحاله.</p> : null}
          </div>
          <div className="text-end">
            <p className="text-lg font-bold"><Num>{eta ? formatDate(eta) : "بدون موعد"}</Num></p>
            <p className="font-bold">{stateWord(row, containers, today)}</p>
            {props.canEdit && arrivalPassed(row, containers, today) && !markedReady(row, containers) ? (
              <button type="button" className={cn(pineSolid, "mt-2 h-10 px-3")} onClick={(event) => { event.stopPropagation(); props.onReady(row); }}>جاهزة</button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-[5.5rem_1fr] gap-y-1 text-lg font-bold">
          <span>القيمة</span>
          <span><Num>{row.amount <= 0 ? "بدون مبلغ" : `${money(row.amount)} ${currencyWord(row.currency)}`}</Num></span>
          <span>المدفوع</span>
          <span><Num>{money(paidAmount)} {currencyWord(row.currency)}</Num>{lastPay ? <span className="mt-1 block whitespace-nowrap"><Num>{formatDate(lastPay.paidOn)}</Num></span> : null}</span>
          <span>المتبقي</span>
          <span className={paid || row.amount <= 0 ? "text-pine" : "text-danger"}>{row.amount <= 0 ? "بدون مبلغ" : paid ? "تم الدفع" : <Num>{money(left)} {currencyWord(row.currency)}</Num>}</span>
        </div>
        {open ? (
          <div className="mt-3 border-t border-black pt-3" onClick={(event) => event.stopPropagation()}>
            {pays.length === 0 ? <p className="font-bold">ما في دفعات</p> : (
              <ul className="font-bold">{pays.map((pay, index) => (
                <li key={pay.id} className="mt-1 flex flex-wrap items-center gap-2">
                  <span>دفعة {index + 1}: {formatDate(pay.paidOn)} · {money(pay.amount)} {currencyWord(row.currency)}</span>
                  {props.canEdit ? <button type="button" className={cn(surfaceBtn, "h-9 px-2")} onClick={() => props.onDeletePay(pay.id)}>حذف</button> : null}
                </li>
              ))}</ul>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {props.canEdit ? <button type="button" className={cn(pineSolid, "h-11 px-4")} onClick={() => props.onEdit(row)}>تعديل</button> : null}
              {left >= 5 ? <button type="button" className={cn(surfaceBtn, "h-11 px-4")} onClick={() => props.setHomePay(props.homePay === row.id ? "" : row.id)}>دفعة</button> : null}
              {props.canEdit && arrivalPassed(row, containers, today) && !markedReady(row, containers) ? (
                <button type="button" className={cn(pineSolid, "h-11 px-4")} onClick={() => props.onReady(row)}>جاهزة</button>
              ) : null}
              {props.canEdit && markedReady(row, containers) ? (
                props.archiveId === row.id ? <ArchiveBox onSave={(customs) => props.onArchive(row, customs)} /> : <button type="button" className={cn(surfaceBtn, "h-11 px-4")} onClick={() => props.setArchiveId(row.id)}>أرشفة</button>
              ) : null}
            </div>
            {props.homePay === row.id && left >= 5 ? <QuickPay currency={currencyWord(row.currency)} max={left} onSave={(amount, paidOn) => { props.onPay(row, amount, paidOn); props.setHomePay(""); }} /> : null}
            {row.number === "7" && group.length ? <div className="mt-3"><Papers rows={group} files={props.files} canEdit={props.canEdit} onOpen={props.onOpenFile} onSave={props.onSaveFile} /></div> : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="no-print mt-2 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {(["meat", "fish"] as const).map((key) => (
          <button key={key} type="button" className={cn("h-14 rounded-2xl text-xl font-bold", book === key ? "bg-pine text-surface" : "bg-surface")} onClick={() => setBook(key)}>
            {key === "fish" ? "سمك" : "عجل"}
          </button>
        ))}
      </div>
      <section className="rounded-3xl bg-surface px-4 py-4">
        <p className="text-sm font-bold text-muted">المتبقي {book === "fish" ? "سمك" : "عجل"}</p>
        <p className="text-3xl font-bold text-danger">
          {total.size === 0 ? "0" : [...total.entries()].map(([currency, amount]) => <span key={currency} className="me-3"><Num>{money(amount)} {currencyWord(currency)}</Num></span>)}
        </p>
        {nearest ? (
          <p className="mt-2 text-lg font-bold">الأقرب: <Inv>{nearest.number === "7" ? "7 · 8 · 13 · 14" : nearest.number}</Inv> · {invoiceArrival(nearest, containers) ? formatDate(invoiceArrival(nearest, containers)) : "بدون موعد"} · {money(remainingOf(nearest, payments))} {currencyWord(nearest.currency)}</p>
        ) : <p className="mt-2 text-lg font-bold">ما في مبلغ باقي بهالقسم</p>}
      </section>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className={cn(field, "h-12")} value={props.homeQuery} placeholder="رقم الفاتورة" onChange={(event) => { props.setHomeQuery(event.target.value); window.localStorage.setItem("marsa-home-query", event.target.value); }} />
        <button type="button" className={cn(surfaceBtn, "h-12 px-4", props.homeDueOnly && "border-pine bg-pine text-surface")} onClick={() => props.setHomeDueOnly((value) => { const next = !value; window.localStorage.setItem("marsa-home-due", next ? "1" : "0"); return next; })}>{props.homeDueOnly ? "الكل" : "الباقي فقط"}</button>
        <button type="button" className={cn(surfaceBtn, "h-12 px-4")} onClick={props.onPrint}>طباعة الكل</button>
        <button type="button" className={cn(pineSolid, "h-12 px-4")} onClick={props.onPrintDue}>طباعة الغير مدفوع فقط</button>
      </div>
      {rows.length ? <section className="flex flex-col gap-3">{rows.map(card)}</section> : <p className="text-lg font-bold">ما في فواتير</p>}
    </div>
  );
}

function CategoryTable(props: {
  category: "meat" | "fish";
  invoices: Invoice[];
  containers: Container[];
  payments: Payment[];
  today: string;
  canEdit: boolean;
  homeQuery: string;
  homeDueOnly: boolean;
  homeSort: "arrival" | "remaining";
  homeOpen: string;
  setHomeOpen: (value: string) => void;
  homePay: string;
  setHomePay: (value: string) => void;
  archiveId: string;
  setArchiveId: (value: string) => void;
  onEdit: (row: Invoice) => void;
  onPay: (row: Invoice, amount: number, paidOn: string) => void;
  onArchive: (row: Invoice, customs: string) => void;
  setToast: (value: string) => void;
  files: { invoiceId: string; kind: string; filename: string }[];
  group: Invoice[];
  onOpenFile: (invoiceId: string, kind: PdfKind) => void;
  onSaveFile: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
}) {
  const { category, invoices, containers, payments, today } = props;
  const needle = props.homeQuery.trim().toLowerCase();
  const rows = invoices.filter((row) => {
    if (row.category !== category) return false;
    if (needle && !`${row.number} ${row.containerNumber}`.toLowerCase().includes(needle)) return false;
    const over = row.amount > 0 && paidSum(row.id, payments) - row.amount > 0.009;
    if (props.homeDueOnly && !over && (row.amount <= 0 || remainingOf(row, payments) < 5)) return false;
    return true;
  }).sort((a, b) => {
    const rank = (row: Invoice) => {
      const left = remainingOf(row, payments);
      const paidAmount = paidSum(row.id, payments);
      if (row.amount > 0 && paidAmount - row.amount > 0.009) return -1;
      if (row.amount <= 0 || left < 5) return 2;
      if (paidAmount > 0) return 1;
      return 0;
    };
    const byRank = rank(a) - rank(b);
    if (byRank) return byRank;
    if (props.homeSort === "remaining") return remainingOf(b, payments) - remainingOf(a, payments);
    return compareArrival(invoiceArrival(a, containers), invoiceArrival(b, containers)) || a.number.localeCompare(b.number);
  });
  const totals = new Map<string, number>();
  for (const row of rows) {
    const left = remainingOf(row, payments);
    if (row.amount <= 0 || left < 5) continue;
    totals.set(row.currency, (totals.get(row.currency) ?? 0) + left);
  }
  return (
    <section className="overflow-x-auto rounded-3xl bg-surface shadow-sm">
      <h2 className="px-4 py-3 text-2xl font-bold">{category === "fish" ? "سمك" : "عجل"}</h2>
      <table className="home-sheet w-full border-collapse text-base font-bold">
        <thead>
          <tr>
            <th className="px-3 py-2">رقم الفاتورة</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">المورد</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">المستورد</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">الصنف</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">المخلّص</th>
            <th className="px-3 py-2">الوصول</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">الحالة</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">قيمة الفاتورة</th>
            <th className="home-more hidden px-3 py-2 md:table-cell">المدفوع</th>
            <th className="px-3 py-2">المتبقي</th>
            <th className="px-3 py-2">للأرشيف</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const eta = invoiceArrival(row, containers);
            const box = boxOf(row, containers);
            const left = remainingOf(row, payments);
            const paidAmount = paidSum(row.id, payments);
            const paid = row.amount > 0 && left < 5;
            const over = row.amount > 0 && paidAmount - row.amount > 0.009;
            const tone = over ? "home-over" : row.amount <= 0 ? "" : paid ? "home-paid" : paidAmount > 0 ? "home-part" : "home-open";
            const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
            const lastPay = pays[pays.length - 1];
            const state = stateWord(row, containers, today);
            return (
              <Fragment key={row.id}>
                <tr className={cn("cursor-pointer", tone)} onClick={() => props.setHomeOpen(props.homeOpen === row.id ? "" : row.id)}>
                  <td className="px-3 py-3">
                    <button type="button" onClick={(event) => { event.stopPropagation(); void navigator.clipboard.writeText(row.number).then(() => props.setToast("تم نسخ الرقم")); }}><Inv>{row.number}</Inv></button>
                    {row.number === "7" ? <span className="mt-1 block text-sm">المبلغ والدفعات تشمل 8 و 13 و 14. أوراق كل رقم لحاله.</span> : null}
                    {props.canEdit ? <button type="button" className={cn(surfaceBtn, "mt-1 h-9 px-2")} onClick={(event) => { event.stopPropagation(); props.onEdit(row); }}>تعديل</button> : null}
                  </td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{row.supplier}</td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{row.importer}</td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{row.product}</td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{box?.broker || ""}</td>
                  <td className="px-3 py-3"><Num>{eta ? formatDate(eta) : "بدون موعد"}</Num></td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{state}</td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">{row.amount <= 0 ? "بدون مبلغ" : <Num>{money(row.amount)} {currencyWord(row.currency)}</Num>}</td>
                  <td className="home-more hidden px-3 py-3 md:table-cell">
                    <Num>{money(paidAmount)} {currencyWord(row.currency)}</Num>
                    {lastPay ? <span className="mt-1 block text-sm">{formatDate(lastPay.paidOn)}</span> : null}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.amount <= 0 ? "بدون مبلغ" : paid || over ? "تم الدفع" : <Num>{money(left)} {currencyWord(row.currency)}</Num>}
                    {!over && left >= 5 ? <button type="button" className={cn(surfaceBtn, "mt-1 h-9 px-2")} onClick={(event) => { event.stopPropagation(); props.setHomePay(row.id); props.setHomeOpen(row.id); }}>دفعة</button> : null}
                  </td>
                  <td className="px-3 py-3">
                    {props.canEdit && arrivalPassed(row, containers, today) ? (
                      props.archiveId === row.id ? <ArchiveBox onSave={(customs) => props.onArchive(row, customs)} /> : <button type="button" className={cn(surfaceBtn, "h-9 px-2")} onClick={(event) => { event.stopPropagation(); props.setArchiveId(row.id); }}>أرشفة</button>
                    ) : null}
                  </td>
                </tr>
                {props.homeOpen === row.id ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-3">
                      <p className="mb-2 md:hidden">{row.supplier} · {row.importer} · {row.product} · {box?.broker || "بدون مخلّص"} · {state}</p>
                      {pays.length === 0 ? <p>ما في دفعات</p> : (
                        <ul>{pays.map((pay, index) => <li key={pay.id}>دفعة {index + 1}: <Num>{formatDate(pay.paidOn)} · {money(pay.amount)} {currencyWord(row.currency)}</Num></li>)}</ul>
                      )}
                      {props.homePay === row.id && left >= 5 ? <QuickPay currency={currencyWord(row.currency)} max={left} onSave={(amount, paidOn) => { props.onPay(row, amount, paidOn); props.setHomePay(""); }} /> : null}
                      {row.number === "7" && props.group.length ? <Papers rows={props.group} files={props.files} canEdit={props.canEdit} onOpen={props.onOpenFile} onSave={props.onSaveFile} /> : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <p className="flex flex-wrap items-center gap-3 px-4 py-3 text-lg font-bold">
        <span>مجموع المتبقي {totals.size === 0 ? "0" : [...totals.entries()].map(([currency, amount]) => <span key={currency} className="text-danger"><Num>{money(amount)} {currencyWord(currency)}</Num> </span>)}</span>
        <button type="button" className={cn(surfaceBtn, "h-10 px-3")} onClick={() => {
          const text = totals.size === 0 ? "0" : [...totals.entries()].map(([currency, amount]) => `${money(amount)} ${currencyWord(currency)}`).join(" · ");
          void navigator.clipboard.writeText(`مجموع المتبقي ${category === "fish" ? "سمك" : "عجل"}: ${text}`).then(() => props.setToast("تم نسخ المجموع"));
        }}>نسخ المجموع</button>
      </p>
    </section>
  );
}

function Sheet({ title, invoices, containers, payments, today, canEdit, onEdit, files, group, onOpenFile, onSaveFile }: {
  title: string;
  invoices: Invoice[];
  containers: Container[];
  payments: Payment[];
  today: string;
  canEdit: boolean;
  onEdit: (row: Invoice) => void;
  files: { invoiceId: string; kind: string; filename: string }[];
  group: Invoice[];
  onOpenFile: (invoiceId: string, kind: PdfKind) => void;
  onSaveFile: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
}) {
  const [openId, setOpenId] = useState("");
  const rows = invoices.slice().sort((a, b) => compareArrival(invoiceArrival(a, containers), invoiceArrival(b, containers)) || a.number.localeCompare(b.number));
  return (
    <section className="no-print mt-4 overflow-x-auto rounded-3xl bg-surface shadow-sm">
      <h2 className="px-4 py-3 text-2xl font-bold">{title}</h2>
      <table className="home-sheet w-full border-collapse text-base font-bold">
        <thead>
          <tr>
            <th className="px-3 py-2">رقم الفاتورة</th>
            <th className="px-3 py-2">المورد</th>
            <th className="px-3 py-2">المستورد</th>
            <th className="px-3 py-2">الصنف</th>
            <th className="px-3 py-2">الوصول</th>
            <th className="px-3 py-2">المتبقي</th>
            <th className="px-3 py-2">الحاوية</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const left = remainingOf(row, payments);
            const eta = invoiceArrival(row, containers);
            const box = boxOf(row, containers);
            const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
            const open = openId === row.id;
            const paperRows = row.number === "7" ? group : [row];
            return (
              <Fragment key={row.id}>
              <tr>
                <td className="px-3 py-3">
                  <button type="button" className="text-start" onClick={() => setOpenId(open ? "" : row.id)}><Inv>{row.number}</Inv></button>
                  {row.number === "7" ? <span className="mt-1 block text-sm">المبلغ والدفعات تشمل 8 و 13 و 14. أوراق كل رقم لحاله.</span> : null}
                </td>
                <td className="px-3 py-3">{row.supplier}</td>
                <td className="px-3 py-3">{row.importer}</td>
                <td className="px-3 py-3">{row.product}</td>
                <td className="px-3 py-3"><Num>{eta ? formatDate(eta) : "بدون موعد"}</Num><span className="mt-1 block text-sm">{stateWord(row, containers, today)}</span></td>
                <td className="px-3 py-3">{row.amount <= 0 ? "بدون مبلغ" : left < 5 ? "تم الدفع" : <Num>{money(left)} {currencyWord(row.currency)}</Num>}</td>
                <td className="px-3 py-3">{row.containerNumber}</td>
              </tr>
              {open ? (
                <tr>
                  <td colSpan={7} className="px-3 py-3">
                    <div className="grid gap-1">
                      <p>القيمة: {money(row.amount)} {currencyWord(row.currency)} · المدفوع: {money(paidSum(row.id, payments))} · المتبقي: {row.amount <= 0 ? "بدون مبلغ" : left < 5 ? "تم الدفع" : money(left)}</p>
                      <p>الكمية: {row.quantity || "—"} · المخلّص: {box?.broker || "—"} · الشحن: {box?.lineName || "—"}</p>
                      <p>الحاوية: {row.containerNumber || "—"} · البيان: {box?.customsNo || "—"} · التيليكس: {box?.telexState || "ما انطلب"} · الأوراق: {box?.docsArrived ? "وصلت" : "لسا"}</p>
                      <p>الملاحظات: {row.note || "—"}</p>
                      {pays.length === 0 ? <p>ما في دفعات</p> : pays.map((pay, index) => <p key={pay.id}>دفعة {index + 1}: {formatDate(pay.paidOn)} · {money(pay.amount)} {currencyWord(row.currency)}{pay.note ? ` · ${pay.note}` : ""}</p>)}
                    </div>
                    {canEdit ? <button type="button" className={cn(pineSolid, "mt-3 h-11 px-4")} onClick={() => onEdit(row)}>تعديل</button> : null}
                    <div className="mt-3"><Papers rows={paperRows} files={files} canEdit={canEdit} onOpen={onOpenFile} onSave={onSaveFile} /></div>
                  </td>
                </tr>
              ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Find(props: {
  query: string;
  setQuery: (value: string) => void;
  invoices: Invoice[];
  containers: Container[];
  payments: Payment[];
  today: string;
  canEdit: boolean;
  onEdit: (row: Invoice) => void;
  onPay: (row: Invoice) => void;
  files: { invoiceId: string; kind: string; filename: string }[];
  group: Invoice[];
  onOpenFile: (invoiceId: string, kind: PdfKind) => void;
  onSaveFile: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
}) {
  const needle = props.query.trim().toLowerCase();
  let found = needle ? props.invoices.filter((row) => row.number.toLowerCase().includes(needle) || row.containerNumber.toLowerCase().includes(needle)) : [];
  if (found.some((row) => spanishNumbers.includes(row.number as (typeof spanishNumbers)[number]))) {
    found = found.filter((row) => !isSpanishPaper(row) && row.number !== "7");
    const head = props.invoices.find((row) => row.number === "7" && row.category === "fish");
    if (head) found = [head, ...found];
  }
  return (
    <section className="no-print mt-4 flex flex-col gap-4">
      <h2 className="text-2xl font-bold">بحث</h2>
      <input className={cn(field, "h-12")} value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="رقم الفاتورة" />
      {!needle ? <p className="font-bold">اكتب رقم الفاتورة.</p> : null}
      {needle && !found.length ? <p className="font-bold">ما في فاتورة بهذا الرقم</p> : null}
      {found.map((row) => {
        const box = boxOf(row, props.containers);
        const eta = invoiceArrival(row, props.containers);
        const pays = props.payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
        const left = remainingOf(row, props.payments);
        const href = linkOf(row, props.containers);
        return (
          <article key={row.id} className="rounded-3xl bg-surface p-4">
            <h3 className="text-2xl font-bold"><Inv>{row.number}</Inv> · {row.category === "fish" ? "سمك" : "عجل"}</h3>
            <div className="mt-2 grid gap-1 font-bold">
              <p>المورد: {row.supplier}</p>
              <p>المستورد: {row.importer}</p>
              <p>الصنف: {row.product || "—"} · الكمية: {row.quantity || "—"}</p>
              <p>قيمة الفاتورة: <Num>{money(row.amount)} {currencyWord(row.currency)}</Num></p>
              <p>المدفوع: <Num>{money(paidSum(row.id, props.payments))} {currencyWord(row.currency)}</Num></p>
              <p>المتبقي: {left < 5 && row.amount > 0 ? "تم الدفع" : <Num>{money(left)} {currencyWord(row.currency)}</Num>}</p>
              <p>الحاوية: {row.containerNumber || "—"} · الوصول: {eta ? formatDate(eta) : "بدون موعد"} · {stateWord(row, props.containers, props.today)}</p>
              <p>المخلّص: {box?.broker || "—"} · الشحن: {box?.lineName || "—"}</p>
              <p>الرابط: {href ? <a className="underline" href={href} target="_blank" rel="noreferrer">{href}</a> : "—"}</p>
              <p>البيان: {box?.customsNo || "—"} · التيليكس: {box?.telexState || "ما انطلب"} · الأوراق: {box?.docsArrived ? "وصلت" : "لسا"}</p>
              <p>ملاحظات: {row.note || "—"}</p>
            </div>
            <ul className="mt-2">{pays.map((pay, index) => <li key={pay.id}>دفعة {index + 1}: {formatDate(pay.paidOn)} · {money(pay.amount)}</li>)}</ul>
            {row.number === "7" && props.group.length ? <div className="mt-3"><Papers rows={props.group} files={props.files} canEdit={props.canEdit} onOpen={props.onOpenFile} onSave={props.onSaveFile} /></div> : null}
            {props.canEdit ? <button type="button" className={cn(pineSolid, "mt-3 h-12 px-4")} onClick={() => props.onEdit(row)}>تعديل الفاتورة</button> : null}
          </article>
        );
      })}
    </section>
  );
}

function DetailPrint({ invoices, containers, payments, today }: { invoices: Invoice[]; containers: Container[]; payments: Payment[]; today: string }) {
  const blocks = (["meat", "fish"] as const).map((key) => ({
    key,
    rows: invoices
      .filter((row) => row.category === key)
      .sort((a, b) => byNearest(invoiceArrival(a, containers), invoiceArrival(b, containers), today) || a.number.localeCompare(b.number)),
  })).filter((block) => block.rows.length);
  return (
    <section className="print-sheet detail-print text-ink">
      <header className="print-head">
        <p className="print-brand">تفاصيل كل فاتورة</p>
        <p className="print-date">{formatDate(today)}</p>
      </header>
      {blocks.map((block) => (
        <div key={block.key} className="print-split">
          <h2>{block.key === "fish" ? "سمك" : "عجل"}</h2>
          {block.rows.map((row) => {
            const box = boxOf(row, containers);
            const left = remainingOf(row, payments);
            const paidAmount = paidSum(row.id, payments);
            const eta = invoiceArrival(row, containers);
            const pays = payments.filter((item) => item.invoiceId === row.id).slice().sort((a, b) => a.paidOn.localeCompare(b.paidOn));
            const cells: [string, string][] = [
              ["رقم الفاتورة", row.number === "7" ? "7 · 8 · 13 · 14" : row.number],
              ["المورد", row.supplier || "—"],
              ["المستورد", row.importer || "—"],
              ["الصنف", row.product || "—"],
              ["الكمية", row.quantity || "—"],
              ["مبلغ الفاتورة", row.amount <= 0 ? "بدون مبلغ" : `${money(row.amount)} ${currencyWord(row.currency)}`],
              ["مجموع المدفوع", `${money(paidAmount)} ${currencyWord(row.currency)}`],
              ["المتبقي", row.amount <= 0 ? "بدون مبلغ" : left < 5 ? "تم الدفع" : `${money(left)} ${currencyWord(row.currency)}`],
              ["موعد الوصول", eta ? `${formatDate(eta)} · ${stateWord(row, containers, today)}` : "بدون موعد"],
              ["رقم الحاوية", row.containerNumber || "—"],
              ["المخلص", box?.broker || "—"],
              ["رخصة الزراعة", row.agriAvailable ? row.agriLicense || "متوفرة" : "غير متوفرة"],
              ["رخصة بيت إيل", row.beitElAvailable ? row.beitElLicense || "متوفرة" : "غير متوفرة"],
              ["التيليكس", box?.telexState || "ما انطلب"],
              ["الأوراق الأصلية", box?.docsArrived ? "وصلت" : "لسا"],
              ["رقم DHL", box?.dhlShipment || "—"],
              ["وصول الأوراق", box?.docsBrokerDate || box?.dhlDate || "—"],
              ["البيان الجمركي", box?.customsNo || "—"],
              ["ملاحظات", row.note || "—"],
            ];
            const pairs = [];
            for (let index = 0; index < cells.length; index += 2) pairs.push([cells[index], cells[index + 1]] as const);
            return (
              <article key={row.id}>
                <table>
                  <tbody>
                    {pairs.map(([leftCell, rightCell]) => (
                      <tr key={leftCell[0]}>
                        <th>{leftCell[0]}</th>
                        <td>{leftCell[1]}</td>
                        {rightCell ? <th>{rightCell[0]}</th> : null}
                        {rightCell ? <td>{rightCell[1]}</td> : <td colSpan={2} />}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table>
                  <thead>
                    <tr>
                      <th>الدفعة</th>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pays.length === 0 ? <tr><td colSpan={4}>ما في دفعات</td></tr> : pays.map((pay, index) => (
                      <tr key={pay.id}>
                        <td>دفعة {index + 1}</td>
                        <td>{formatDate(pay.paidOn)}</td>
                        <td>{money(pay.amount)} {currencyWord(row.currency)}</td>
                        <td>{pay.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}

function PrintSheet({ invoices, containers, payments, today, dueOnly }: { invoices: Invoice[]; containers: Container[]; payments: Payment[]; today: string; dueOnly: boolean }) {
  const parked = (row: Invoice) => {
    const box = boxOf(row, containers);
    return box?.status === "reserved" || box?.status === "hold";
  };
  const source = dueOnly ? invoices.filter((row) => row.amount > 0 && remainingOf(row, payments) >= 5) : invoices;
  const blocks = (["meat", "fish"] as const).map((key) => {
    const ordered = source
      .filter((row) => row.category === key)
      .sort((a, b) => byNearest(invoiceArrival(a, containers), invoiceArrival(b, containers), today) || a.number.localeCompare(b.number));
    const rows = [...ordered.filter((row) => !parked(row)), ...ordered.filter(parked)];
    return { key, rows, parkedAt: ordered.filter((row) => !parked(row)).length };
  }).filter((block) => block.rows.length);
  return (
    <section className="print-sheet print-brief text-ink">
      <header className="print-head">
        <p className="print-brand">الحاويات{dueOnly ? " · الغير مدفوع" : ""}</p>
        <p className="print-date">{formatDate(today)}</p>
      </header>
      {blocks.map((block) => (
        <div key={block.key} className="print-split">
          <h2>{block.key === "fish" ? "سمك" : "عجل"}</h2>
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>المورد</th>
                <th>المستورد</th>
                <th>الصنف</th>
                <th>قيمة الفاتورة</th>
                <th>المبلغ المدفوع</th>
                <th>المتبقي</th>
                <th>تاريخ الوصول</th>
                <th>عدد الأيام</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => {
                const left = remainingOf(row, payments);
                const paidAmount = paidSum(row.id, payments);
                const eta = invoiceArrival(row, containers);
                const days = eta ? dayDiff(eta, today) : null;
                return (
                  <Fragment key={row.id}>
                    {index === block.parkedAt && block.parkedAt < block.rows.length ? <tr><td colSpan={9}>محجوزة ومعلّقة</td></tr> : null}
                    <tr>
                      <td>{row.number === "7" ? "7 · 8 · 13 · 14" : row.number}</td>
                      <td>{row.supplier}</td>
                      <td>{row.importer}</td>
                      <td>{row.product}</td>
                      <td>{row.amount <= 0 ? "بدون مبلغ" : `${money(row.amount)} ${currencyWord(row.currency)}`}</td>
                      <td>{money(paidAmount)} {currencyWord(row.currency)}</td>
                      <td className={left > 0.009 ? "print-due" : "print-ok"}>{row.amount <= 0 ? "بدون مبلغ" : left > 0.009 ? `${money(left)} ${currencyWord(row.currency)}` : "تم الدفع"}</td>
                      <td>{eta ? formatDate(eta) : "بدون موعد"}</td>
                      <td>{days === null ? "—" : markedReady(row, containers) ? "جاهزة" : days <= 0 ? "عدّى الموعد" : String(days)}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function Papers({ rows, files, canEdit, onOpen, onSave }: {
  rows: Invoice[];
  files: { invoiceId: string; kind: string; filename: string }[];
  canEdit: boolean;
  onOpen: (invoiceId: string, kind: PdfKind) => void;
  onSave: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
}) {
  return (
    <div className="grid gap-2" onClick={(event) => event.stopPropagation()}>
      {rows.length > 1 ? <p className="font-bold">فاتورة واحدة بالمبلغ والدفعات. مستندات كل رقم لحاله.</p> : null}
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-black p-2">
          <p className="font-bold">رقم {row.number} · {row.supplier}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {pdfKinds.map((item) => {
              const saved = files.some((file) => file.invoiceId === row.id && file.kind === item.kind);
              return (
                <span key={item.kind} className="flex items-center gap-1">
                  <button type="button" className={cn(surfaceBtn, "h-10 px-2")} disabled={!saved} onClick={() => onOpen(row.id, item.kind)}>{item.label}{saved ? "" : " · فاضي"}</button>
                  {canEdit ? (
                    <label className={cn(surfaceBtn, "h-10 cursor-pointer px-2")}>
                      رفع
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => onSave(row.id, item.kind, file.name, String(reader.result || ""));
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

async function openStored(invoiceId: string, kind: PdfKind, setToast: (value: string) => void) {
  try {
    const file = await loadInvoiceFile({ data: { invoiceId, kind } });
    if (!file?.data) {
      setToast("ما في ملف");
      return;
    }
    const blob = await (await fetch(file.data)).blob();
    window.open(URL.createObjectURL(blob), "_blank", "noopener");
  } catch (error) {
    setToast(error instanceof Error ? error.message : "تعذّر فتح الملف");
  }
}

function ArchiveBox({ onSave }: { onSave: (customs: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  return (
    <form className="flex min-w-36 flex-col gap-1" onClick={(event) => event.stopPropagation()} onSubmit={(event) => {
      event.preventDefault();
      if (!value.trim()) { setError("رقم البيان إجباري"); return; }
      onSave(value.trim());
    }}>
      <input className={field} value={value} onChange={(event) => setValue(event.target.value)} placeholder="رقم البيان الجمركي" />
      <button type="submit" className={cn(surfaceBtn, "h-10")}>للأرشيف</button>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </form>
  );
}

function QuickPay({ currency, max, onSave }: { currency: string; max: number; onSave: (amount: number, date: string) => void }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDate(todayISO()));
  const [error, setError] = useState("");
  return (
    <form className="mt-2 flex max-w-xs flex-col gap-1" onClick={(event) => event.stopPropagation()} onSubmit={(event) => {
      event.preventDefault();
      const value = Number(String(amount).replace(/,/g, ""));
      const paidOn = parseTypedDate(date);
      if (!Number.isFinite(value) || value <= 0) { setError("المبلغ غير صحيح"); return; }
      if (value - max > 0.009) { setError(`المتبقي ${money(max)} ${currency}`); return; }
      if (!paidOn) { setError("اكتب التاريخ مثل 17-10-2026"); return; }
      onSave(value, paidOn);
    }}>
      <input className={field} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="جزء أو كامل، مثلاً 40000" />
      <input className={field} value={date} onChange={(event) => setDate(event.target.value)} placeholder="17-10-2026" />
      <p className="text-sm font-bold">المتبقي {money(max)} {currency}. الدفعة ما لازم تكون المبلغ كامل.</p>
      <button type="submit" className={cn(surfaceBtn, "h-10")}>حفظ الدفعة</button>
      {error ? <span className="text-sm text-danger">{error}</span> : null}
    </form>
  );
}

function draftOf(box: Container): ContainerDraft {
  return {
    number: box.number,
    type: box.type || "40 قدم",
    port: box.port || "",
    status: box.status,
    eta: box.eta || "",
    invoiceNumber: box.invoiceNumber || "",
    note: box.note || "",
    category: box.category,
    broker: box.broker || "",
    dhlAddress: box.dhlAddress || "",
    dhlShipment: box.dhlShipment || "",
    docsRequested: box.docsRequested,
    docsArrived: box.docsArrived,
    telexRequested: box.telexRequested,
    telexState: box.telexState || "",
    emailRequested: box.emailRequested,
    docsEmail: box.docsEmail || "",
    telexEmail: box.telexEmail || "",
    docsBrokerDate: box.docsBrokerDate || "",
    lineName: box.lineName || "",
    trackUrl: box.trackUrl || "",
    customsNo: box.customsNo || "",
    atCompany: box.atCompany,
  };
}

function Editor({ invoice, box, files, paperRows, onOpenFile, onSaveFile, onClose, onSave }: {
  invoice: Invoice;
  box: Container | null;
  files: { invoiceId: string; kind: string; filename: string }[];
  paperRows: Invoice[];
  onOpenFile: (invoiceId: string, kind: PdfKind) => void;
  onSaveFile: (invoiceId: string, kind: PdfKind, filename: string, data: string) => void;
  onClose: () => void;
  onSave: (invoiceDraft: InvoiceDraft, containerDraft: ContainerDraft, containerId: string) => void;
}) {
  const [number, setNumber] = useState(invoice.number);
  const [supplier, setSupplier] = useState(invoice.supplier);
  const [importer, setImporter] = useState(invoice.importer);
  const [product, setProduct] = useState(invoice.product);
  const [quantity, setQuantity] = useState(invoice.quantity);
  const [amount, setAmount] = useState(String(invoice.amount));
  const [currency, setCurrency] = useState<Currency>(invoice.currency);
  const [note, setNote] = useState(invoice.note);
  const shownContainer = invoice.containerNumber || box?.number || "";
  const [containerNumber, setContainerNumber] = useState(shownContainer === invoice.number ? box?.number && box.number !== invoice.number ? box.number : "" : shownContainer);
  const [eta, setEta] = useState(box?.eta ? formatDate(box.eta) : "");
  const [status, setStatus] = useState<ContainerStatus>(box?.status ?? "transit");
  const [broker, setBroker] = useState(box?.broker ?? "");
  const [trackUrlValue, setTrackUrlValue] = useState(box?.trackUrl || trackingUrl(invoice.containerNumber));
  const [lineName, setLineName] = useState(box?.lineName ?? "");
  const [customsNo, setCustomsNo] = useState(box?.customsNo ?? "");
  const [atCompany, setAtCompany] = useState(box?.atCompany ? "yes" : "no");
  const [agri, setAgri] = useState(invoice.agriLicense);
  const [beit, setBeit] = useState(invoice.beitElLicense);
  const [section, setSection] = useState<"meat" | "fish">(invoice.category);
  const [boxType, setBoxType] = useState(box?.type || "40 قدم");
  const [port, setPort] = useState(box?.port ?? "");
  const [boxNote, setBoxNote] = useState(box?.note ?? "");
  const [telex, setTelex] = useState(box?.telexState ?? "");
  const [telexEmail, setTelexEmail] = useState(box?.telexEmail ?? "");
  const [docs, setDocs] = useState(box?.docsArrived ? "arrived" : box?.docsRequested ? "requested" : "none");
  const [docsEmail, setDocsEmail] = useState(box?.docsEmail ?? "");
  const [dhlShipment, setDhlShipment] = useState(box?.dhlShipment ?? "");
  const [dhlAddress, setDhlAddress] = useState(box?.dhlAddress ?? "");
  const [docsBrokerDate, setDocsBrokerDate] = useState(box?.docsBrokerDate ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(String(amount).replace(/,/g, ""));
    if (!number.trim() || !supplier.trim() || !importer.trim()) { setError("رقم الفاتورة والمورد والمستورد مطلوبين"); return; }
    if (!Number.isFinite(value) || value < 0) { setError("المبلغ غير صحيح"); return; }
    const etaIso = eta.trim() ? parseTypedDate(eta) : "";
    if (eta.trim() && !etaIso) { setError("اكتب موعد الوصول مثل 31-10-2026"); return; }
    if (atCompany === "yes" && !customsNo.trim()) { setError("اكتب رقم البيان الجمركي عشان تنتقل للأرشيف"); return; }
    const invoiceDraft: InvoiceDraft = {
      number: number.trim(),
      supplier: supplier.trim(),
      importer: importer.trim(),
      product: product.trim(),
      quantity: quantity.trim(),
      amount: value,
      currency,
      status: "pending",
      note: note.trim(),
      containerNumber: containerNumber.trim(),
      agriLicense: agri.trim(),
      agriAvailable: Boolean(agri.trim()),
      beitElLicense: beit.trim(),
      beitElAvailable: Boolean(beit.trim()),
      category: section,
    };
    const paper = {
      type: boxType.trim() || "40 قدم",
      port: port.trim(),
      note: boxNote.trim(),
      dhlAddress: dhlAddress.trim(),
      dhlShipment: dhlShipment.trim(),
      docsRequested: docs !== "none",
      docsArrived: docs === "arrived",
      telexRequested: Boolean(telex),
      telexState: telex,
      emailRequested: telex === "emailed",
      docsEmail: docsEmail.trim(),
      telexEmail: telexEmail.trim(),
      docsBrokerDate: docsBrokerDate.trim(),
      category: section,
    };
    const base = box ? draftOf(box) : {
      number: containerNumber.trim(),
      type: "40 قدم",
      port: "",
      status: atCompany === "yes" ? "delivered" : status,
      eta: etaIso,
      invoiceNumber: number.trim(),
      note: "",
      category: invoice.category,
      broker: broker.trim(),
      dhlAddress: "",
      dhlShipment: "",
      docsRequested: false,
      docsArrived: false,
      telexRequested: false,
      telexState: "",
      emailRequested: false,
      docsEmail: "",
      telexEmail: "",
      docsBrokerDate: "",
      lineName: lineName.trim(),
      trackUrl: trackUrlValue.trim(),
      customsNo: customsNo.trim(),
      atCompany: atCompany === "yes",
    } satisfies ContainerDraft;
    onSave(invoiceDraft, {
      ...base,
      number: containerNumber.trim() || base.number,
      status: atCompany === "yes" ? "delivered" : status,
      eta: etaIso,
      invoiceNumber: number.trim(),
      broker: broker.trim(),
      lineName: lineName.trim(),
      trackUrl: trackUrlValue.trim(),
      customsNo: customsNo.trim(),
      atCompany: atCompany === "yes",
      ...paper,
    }, box?.id ?? "");
  }

  return (
    <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <form className="edit-form mx-auto grid max-w-3xl gap-3 rounded-3xl bg-surface p-4" onSubmit={submit}>
        <h2 className="text-2xl font-bold">تحديث فاتورة {invoice.number}</h2>
        <label className="font-bold">رقم الفاتورة<input className={field} value={number} onChange={(event) => setNumber(event.target.value)} /></label>
        <label className="font-bold">المورد<input className={field} value={supplier} onChange={(event) => setSupplier(event.target.value)} /></label>
        <label className="font-bold">المستورد<input className={field} value={importer} onChange={(event) => setImporter(event.target.value)} /></label>
        <label className="font-bold">الصنف<input className={field} value={product} onChange={(event) => setProduct(event.target.value)} /></label>
        <label className="font-bold">الكمية<input className={field} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label className="font-bold">قيمة الفاتورة<input className={field} value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="font-bold">العملة
          <select className={field} value={currency} onChange={(event) => setCurrency(event.target.value as Currency)}>
            <option value="USD">دولار</option>
            <option value="EUR">يورو</option>
            <option value="ILS">شيقل</option>
          </select>
        </label>
        <label className="font-bold">القسم
          <select className={field} value={section} onChange={(event) => setSection(event.target.value as "meat" | "fish")}>
            <option value="meat">عجل وخاروف</option>
            <option value="fish">سمك</option>
          </select>
        </label>
        <h3 className="pt-2 text-xl font-bold text-ink">الحاوية</h3>
        <label className="font-bold">رقم الحاوية<input className={field} value={containerNumber} onChange={(event) => { setContainerNumber(event.target.value); if (!trackUrlValue) setTrackUrlValue(trackingUrl(event.target.value)); }} /></label>
        <label className="font-bold">موعد الوصول<input className={field} value={eta} onChange={(event) => setEta(event.target.value)} placeholder="31-10-2026" /></label>
        <label className="font-bold">حالة الحاوية
          <select className={field} value={status} onChange={(event) => setStatus(event.target.value as ContainerStatus)}>
            {(Object.keys(boxLabel) as ContainerStatus[]).map((key) => <option key={key} value={key}>{boxLabel[key]}</option>)}
          </select>
        </label>
        <label className="font-bold">المخلّص<input className={field} value={broker} onChange={(event) => setBroker(event.target.value)} /></label>
        <label className="font-bold">شركة الشحن<input className={field} value={lineName} onChange={(event) => setLineName(event.target.value)} /></label>
        <label className="font-bold">نوع الحاوية
          <select className={field} value={boxType} onChange={(event) => setBoxType(event.target.value)}>
            {containerTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            {containerTypes.includes(boxType as (typeof containerTypes)[number]) ? null : <option value={boxType}>{boxType}</option>}
          </select>
        </label>
        <label className="font-bold">الميناء<input className={field} value={port} onChange={(event) => setPort(event.target.value)} /></label>
        <label className="font-bold">رابط الحاوية<input className={field} value={trackUrlValue} onChange={(event) => setTrackUrlValue(event.target.value)} /></label>
        <label className="font-bold">ملاحظة الحاوية<textarea className={cn(field, "min-h-20 py-2")} value={boxNote} onChange={(event) => setBoxNote(event.target.value)} /></label>
        <h3 className="pt-2 text-xl font-bold text-ink">الأوراق</h3>
        <label className="font-bold">التيليكس
          <select className={field} value={telex} onChange={(event) => setTelex(event.target.value)}>
            <option value="">ما انطلب</option>
            <option value="waiting">انطلب</option>
            <option value="emailed">انبعث إيميل</option>
            <option value="received">وصل</option>
          </select>
        </label>
        <label className="font-bold">رابط إيميل التيليكس<input className={field} value={telexEmail} onChange={(event) => setTelexEmail(event.target.value)} placeholder="رابط الإيميل" /></label>
        <label className="font-bold">المستندات الأصلية
          <select className={field} value={docs} onChange={(event) => setDocs(event.target.value)}>
            <option value="none">لسا ما انطلبت</option>
            <option value="requested">انطلبت</option>
            <option value="arrived">وصلت</option>
          </select>
        </label>
        <label className="font-bold">رابط إيميل الأوراق<input className={field} value={docsEmail} onChange={(event) => setDocsEmail(event.target.value)} placeholder="رابط الإيميل" /></label>
        <label className="font-bold">رقم شحنة DHL<input className={field} value={dhlShipment} onChange={(event) => setDhlShipment(event.target.value)} /></label>
        <label className="font-bold">عنوان DHL<input className={field} value={dhlAddress} onChange={(event) => setDhlAddress(event.target.value)} /></label>
        <label className="font-bold">تاريخ وصول الأوراق للمخلص<input className={field} value={docsBrokerDate} onChange={(event) => setDocsBrokerDate(event.target.value)} placeholder="31-10-2026" /></label>
        {box?.dhlStatus || box?.dhlDate ? <p className="font-bold text-ink">حالة DHL: {box.dhlStatus || "—"} {box.dhlDate || ""}</p> : null}
        {box?.etaNote ? <p className="font-bold text-ink">آخر تغيير للموعد: {box.etaNote}</p> : null}
        <h3 className="pt-2 text-xl font-bold text-ink">الملفات</h3>
        <Papers rows={paperRows.length ? paperRows : [invoice]} files={files} canEdit onOpen={onOpenFile} onSave={onSaveFile} />
        <label className="font-bold">رخصة الزراعة<input className={field} value={agri} onChange={(event) => setAgri(event.target.value)} /></label>
        <label className="font-bold">رخصة بيت إيل<input className={field} value={beit} onChange={(event) => setBeit(event.target.value)} /></label>
        <label className="font-bold">وصلت مقر الشركة
          <select className={field} value={atCompany} onChange={(event) => { setAtCompany(event.target.value); setError(""); }}>
            <option value="no">لا</option>
            <option value="yes">نعم، للأرشيف</option>
          </select>
        </label>
        {atCompany === "yes" ? (
          <div className="grid gap-2 rounded-2xl border-2 border-danger bg-[#f6d5d1] p-3">
            <p className="font-bold text-danger">اكتب رقم البيان الجمركي. من غيره الفاتورة ما تنتقل للأرشيف.</p>
            <input className={field} value={customsNo} onChange={(event) => setCustomsNo(event.target.value)} placeholder="رقم البيان الجمركي" autoFocus />
            <button type="submit" className={cn(pineSolid, "h-12 px-4")}>حفظ وانقل للأرشيف</button>
          </div>
        ) : null}
        <label className="font-bold">ملاحظات<textarea className={cn(field, "min-h-24 py-2")} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        {error ? <p className="font-bold text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" className={cn(pineSolid, "h-12 px-4")}>حفظ</button>
          <button type="button" className={cn(surfaceBtn, "h-12 px-4")} onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}
