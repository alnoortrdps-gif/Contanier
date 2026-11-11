import {
  boxLabel,
  arrivalWord,
  dayDiff,
  formatDate,
  currencyWord,
  money,
  paidSum,
  payLabel,
  payState,
  remainingOf,
  todayISO,
  type Container,
  type Invoice,
  type Ledger,
  type Payment,
} from "@/tracker/model";
import { compareArrival, containersForReport, invoiceArrival, type ExcelReport } from "@/tracker/excel";

function licenseCell(available: boolean, number: string) {
  if (!available) return "غير متوفرة";
  return number ? `متوفرة ${number}` : "متوفرة";
}

function ordinal(index: number) {
  const words = ["أولى", "ثانية", "ثالثة", "رابعة", "خامسة", "سادسة", "سابعة", "ثامنة", "تاسعة", "عاشرة"];
  return words[index] ? `دفعة ${words[index]}` : `الدفعة ${index + 1}`;
}

function invoicesFor(box: Container, invoices: Invoice[]) {
  const byNumber = invoices.filter((row) => row.containerNumber && row.containerNumber === box.number);
  if (byNumber.length) return byNumber;
  if (!box.invoiceNumber) return [];
  return invoices.filter((row) => row.number === box.invoiceNumber);
}

function paymentLines(invoice: Invoice, payments: Payment[]) {
  const lines = payments
    .filter((row) => row.invoiceId === invoice.id)
    .slice()
    .sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id.localeCompare(b.id));
  if (!lines.length) return ["لا دفعات"];
  let running = 0;
  return lines.map((line, index) => {
    running = Math.round((running + line.amount) * 100) / 100;
    const left = Math.max(0, Math.round((invoice.amount - running) * 100) / 100);
    const note = line.note ? ` — ملاحظة: ${line.note}` : "";
    return `${ordinal(index)}: التاريخ ${line.paidOn} — مبلغ الفاتورة ${money(invoice.amount)} ${currencyWord(invoice.currency)} — المدفوع ${money(running)} ${currencyWord(invoice.currency)} — المتبقي للدفع ${money(left)} ${currencyWord(invoice.currency)}${note}`;
  });
}

export function papersDue(containers: Container[], today = todayISO()) {
  return containers
    .filter((box) => {
      if (!box.eta || box.docsRequested) return false;
      if (box.status === "reserved" || box.status === "arrived" || box.status === "delivered") return false;
      const left = dayDiff(box.eta, today);
      return left >= 0 && left <= 15;
    })
    .sort((a, b) => a.eta.localeCompare(b.eta) || a.number.localeCompare(b.number, "en"));
}

export function buildPapersMessage(containers: Container[], invoices: Invoice[], payments: Payment[], today = todayISO()) {
  const due = papersDue(containers, today);
  if (!due.length) return "";
  const lines = ["تنبيه الحاويات", "قبل وصول الحاوية بـ 15 يوم لازم الدفعة النهائية والمستندات والتيليكس، عشان يلحقوا يبعتوا الأوراق ويصدر التيليكس.", ""];
  for (const box of due) {
    const linked = invoicesFor(box, invoices);
    const leftDays = dayDiff(box.eta, today);
    lines.push(`حاوية ${box.number}`);
    lines.push(`موعد الوصول: ${formatDate(box.eta)} — ${leftDays === 0 ? "اليوم" : `باقي ${leftDays} يوم`}`);
    if (!linked.length) lines.push("بدون فاتورة");
    for (const invoice of linked) {
      const left = remainingOf(invoice, payments);
      lines.push(`فاتورة ${invoice.number} — ${invoice.supplier}${invoice.product ? ` — ${invoice.product}` : ""}`);
      lines.push(`مبلغ الفاتورة ${money(invoice.amount)} ${currencyWord(invoice.currency)} — المدفوع ${money(paidSum(invoice.id, payments))} — المتبقي ${money(left)} ${currencyWord(invoice.currency)}`);
    }
    lines.push(`المخلّص: ${box.broker || "لم يُحدَّد"}`);
    lines.push(`عنوان DHL: ${box.dhlAddress || "لم يُحدَّد"}`);
    lines.push("الطلب: إرسال الأوراق الأصلية والتيليكس عبر DHL إلى هذا المخلّص على العنوان أعلاه.");
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function openWhatsApp(text: string, phone = "") {
  const digits = phone.replace(/[^\d]/g, "");
  const url = digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export const reportTitle: Record<ExcelReport, string> = {
  arrival: "تقرير حسب موعد الوصول",
  soon: "تقرير الحاويات القريبة الوصول",
  unpaid: "تقرير الباقي عليها دفع",
  paid: "تقرير الحاويات المدفوعة",
  full: "التقرير الكامل",
};

export function buildWhatsAppReport(ledger: Ledger, kind: ExcelReport = "full") {
  const today = todayISO();
  const boxes = containersForReport(kind, ledger)
    .slice()
    .sort((a, b) => compareArrival(a.eta, b.eta) || a.number.localeCompare(b.number, "en"));
  const looseInvoices =
    kind === "full"
      ? ledger.invoices.filter((invoice) => !ledger.containers.some((box) => invoicesFor(box, [invoice]).length))
      : [];
  if (!boxes.length && !looseInvoices.length) return "";

  const lines: string[] = [`*${reportTitle[kind]}*`, "مرتب من الحاوية الأقرب وصولاً", ""];
  boxes.forEach((box, index) => {
    lines.push(`*${index + 1}. رقم الحاوية:* ${box.number}`);
    lines.push(`*موعد الوصول:* ${box.eta || "بدون موعد"} — ${arrivalWord(box.eta, today, box.status)}`);
    lines.push(`*نوع الحاوية:* ${box.type}`);
    lines.push(`*الميناء:* ${box.port || "—"}`);
    lines.push(`*حالة الحاوية:* ${boxLabel[box.status]}`);
    const linked = invoicesFor(box, ledger.invoices);
    if (!linked.length) {
      lines.push("*الفاتورة:* بدون فاتورة");
    }
    for (const invoice of linked) {
      lines.push(`*رقم الفاتورة:* ${invoice.number}`);
      lines.push(`*المورد:* ${invoice.supplier}`);
      lines.push(`*المستورد:* ${invoice.importer}`);
      lines.push(`*المبلغ:* ${money(invoice.amount)} ${currencyWord(invoice.currency)}`);
      lines.push(`*المدفوع:* ${money(paidSum(invoice.id, ledger.payments))} ${currencyWord(invoice.currency)}`);
      lines.push(`*المتبقي:* ${money(remainingOf(invoice, ledger.payments))} ${currencyWord(invoice.currency)}`);
      lines.push(`*حالة الدفع:* ${payLabel[payState(invoice, ledger.payments)]}`);
      lines.push(`*رخصة الزراعة:* ${licenseCell(invoice.agriAvailable, invoice.agriLicense)}`);
      lines.push(`*رخصة بيت إيل:* ${licenseCell(invoice.beitElAvailable, invoice.beitElLicense)}`);
      lines.push(...paymentLines(invoice, ledger.payments));
    }
    if (box.note) lines.push(`*ملاحظة:* ${box.note}`);
    lines.push("");
  });

  if (looseInvoices.length) {
    lines.push("*فواتير بدون حاوية*");
    for (const invoice of looseInvoices) {
      const eta = invoiceArrival(invoice, ledger.containers);
      lines.push(`*رقم الفاتورة:* ${invoice.number}`);
      if (eta) lines.push(`*موعد الوصول:* ${eta} — ${arrivalWord(eta, today)}`);
      lines.push(`*المورد:* ${invoice.supplier} — *المستورد:* ${invoice.importer}`);
      lines.push(`*المبلغ:* ${money(invoice.amount)} ${currencyWord(invoice.currency)} — *المدفوع:* ${money(paidSum(invoice.id, ledger.payments))} — *المتبقي:* ${money(remainingOf(invoice, ledger.payments))}`);
      lines.push(...paymentLines(invoice, ledger.payments));
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

function briefForWhatsApp(ledger: Ledger, kind: ExcelReport) {
  const today = todayISO();
  const boxes = containersForReport(kind, ledger)
    .slice()
    .sort((a, b) => compareArrival(a.eta, b.eta) || a.number.localeCompare(b.number, "en"));
  const head = [reportTitle[kind], `عدد الحاويات: ${boxes.length}`];
  const next = boxes.slice(0, 3).map((box) => {
    const linked = invoicesFor(box, ledger.invoices);
    const left = linked.map((invoice) => `${money(remainingOf(invoice, ledger.payments))} ${currencyWord(invoice.currency)}`).join(" + ");
    return `${box.number} — وصول ${box.eta || "بدون موعد"} (${arrivalWord(box.eta, today, box.status)})${left ? ` — المتبقي ${left}` : ""}`;
  });
  return [...head, ...next, "التقرير الكامل اننسخ. الصقه هنا أو أرفق الملف."].join("\n");
}

const fileName: Record<ExcelReport, string> = {
  arrival: "تقرير-حسب-الوصول.txt",
  soon: "تقرير-القريبة-الوصول.txt",
  unpaid: "تقرير-الباقي-للدفع.txt",
  paid: "تقرير-المدفوعة.txt",
  full: "تقرير-الحاويات-كامل.txt",
};

export async function sendLedgerToWhatsApp(ledger: Ledger, kind: ExcelReport = "full") {
  const text = buildWhatsAppReport(ledger, kind);
  if (!text) return "empty" as const;
  const file = new File([text], fileName[kind], { type: "text/plain" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: reportTitle[kind], text: reportTitle[kind] });
      return "shared" as const;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
  }
  try {
    if (navigator.share) {
      await navigator.share({ title: reportTitle[kind], text });
      return "shared" as const;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName[kind];
    link.click();
    URL.revokeObjectURL(url);
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(briefForWhatsApp(ledger, kind))}`, "_blank", "noopener,noreferrer");
  return "opened" as const;
}
