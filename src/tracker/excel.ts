import writeXlsxFile, { type Schema } from "write-excel-file";
import {
  boxLabel,
  arrivalWord,
  dayDiff,
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

export type ExcelReport = "arrival" | "soon" | "unpaid" | "paid" | "full";

const soonDays = 14;

type ContainerRow = {
  order: number;
  eta: string;
  when: string;
  number: string;
  type: string;
  port: string;
  status: string;
  invoiceNumber: string;
  supplier: string;
  importer: string;
  currency: string;
  amount: number | null;
  paid: number | null;
  remaining: number | null;
  pay: string;
  agri: string;
  beit: string;
  payments: string;
  note: string;
};

type InvoiceRow = {
  eta: string;
  when: string;
  containerNumber: string;
  number: string;
  supplier: string;
  importer: string;
  product: string;
  currency: string;
  amount: number;
  paid: number;
  remaining: number;
  pay: string;
  agri: string;
  beit: string;
  note: string;
};

type PaymentRow = {
  eta: string;
  containerNumber: string;
  invoiceNumber: string;
  title: string;
  paidOn: string;
  amount: number;
  paid: number;
  remaining: number;
  currency: string;
  note: string;
};

const header = {
  fontWeight: "bold" as const,
  backgroundColor: "#1b4d3e",
  color: "#ffffff",
  align: "right" as const,
  wrap: true,
};

export function invoiceArrival(invoice: Invoice, containers: Container[]) {
  const linked =
    containers.find((box) => box.number && box.number === invoice.containerNumber) ??
    containers.find((box) => box.invoiceNumber && box.invoiceNumber === invoice.number);
  return linked?.eta ?? "";
}

export function compareArrival(a: string, b: string) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

function isSoon(box: Container, today: string) {
  if (!box.eta || box.status === "delivered" || box.status === "arrived") return false;
  const left = dayDiff(box.eta, today);
  return left >= 0 && left <= soonDays;
}

function licenseCell(available: boolean, number: string) {
  if (!available) return "غير متوفرة";
  return number ? `متوفرة ${number}` : "متوفرة";
}

function ordinal(index: number) {
  const words = ["أولى", "ثانية", "ثالثة", "رابعة", "خامسة", "سادسة", "سابعة", "ثامنة", "تاسعة", "عاشرة"];
  const word = words[index];
  return word ? `دفعة ${word}` : `الدفعة ${index + 1}`;
}

function invoicesFor(box: Container, invoices: Invoice[]) {
  const byNumber = invoices.filter((row) => row.containerNumber && row.containerNumber === box.number);
  if (byNumber.length) return byNumber;
  if (!box.invoiceNumber) return [];
  return invoices.filter((row) => row.number === box.invoiceNumber);
}

function paymentText(invoice: Invoice, payments: Payment[]) {
  const lines = payments
    .filter((row) => row.invoiceId === invoice.id)
    .slice()
    .sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id.localeCompare(b.id));
  if (!lines.length) return "لا دفعات";
  let running = 0;
  return lines
    .map((line, index) => {
      running = Math.round((running + line.amount) * 100) / 100;
      const left = Math.max(0, Math.round((invoice.amount - running) * 100) / 100);
      return `${ordinal(index)} ${line.paidOn} مبلغ ${line.amount} المدفوع ${running} المتبقي ${left}${line.note ? ` (${line.note})` : ""}`;
    })
    .join(" | ");
}

function containerLines(boxes: Container[], invoices: Invoice[], payments: Payment[], today: string): ContainerRow[] {
  const sorted = boxes.slice().sort((a, b) => compareArrival(a.eta, b.eta) || a.number.localeCompare(b.number));
  const rows: ContainerRow[] = [];
  sorted.forEach((box, index) => {
    const linked = invoicesFor(box, invoices);
    const base = {
      order: index + 1,
      eta: box.eta || "بدون موعد",
      when: arrivalWord(box.eta, today, box.status),
      number: box.number,
      type: box.type,
      port: box.port || "—",
      status: boxLabel[box.status],
      note: box.note || "",
    };
    if (!linked.length) {
      rows.push({
        ...base,
        invoiceNumber: box.invoiceNumber || "—",
        supplier: "—",
        importer: "—",
        currency: "—",
        amount: null,
        paid: null,
        remaining: null,
        pay: "بدون فاتورة",
        agri: "—",
        beit: "—",
        payments: "—",
      });
      return;
    }
    for (const invoice of linked) {
      const paid = Math.round(paidSum(invoice.id, payments) * 100) / 100;
      rows.push({
        ...base,
        invoiceNumber: invoice.number,
        supplier: invoice.supplier,
        importer: invoice.importer,
        currency: invoice.currency,
        amount: invoice.amount,
        paid,
        remaining: remainingOf(invoice, payments),
        pay: payLabel[payState(invoice, payments)],
        agri: licenseCell(invoice.agriAvailable, invoice.agriLicense),
        beit: licenseCell(invoice.beitElAvailable, invoice.beitElLicense),
        payments: paymentText(invoice, payments),
        note: [box.note, invoice.note].filter(Boolean).join(" · "),
      });
    }
  });
  return rows;
}

function selectBoxes(kind: ExcelReport, ledger: Ledger, today: string) {
  const { containers, invoices, payments } = ledger;
  if (kind === "arrival" || kind === "full") return containers;
  if (kind === "soon") return containers.filter((box) => isSoon(box, today));
  return containers.filter((box) => {
    const linked = invoicesFor(box, invoices);
    if (!linked.length) return false;
    const open = linked.some((invoice) => remainingOf(invoice, payments) > 0.009);
    return kind === "unpaid" ? open : !open;
  });
}

export function containersForReport(kind: ExcelReport, ledger: Ledger) {
  return selectBoxes(kind, ledger, todayISO());
}

const containerSchema: Schema<ContainerRow> = [
  { column: "الترتيب", type: Number, value: (row) => row.order, width: 10 },
  { column: "موعد الوصول", type: String, value: (row) => row.eta, width: 16 },
  { column: "قرب الوصول", type: String, value: (row) => row.when, width: 16 },
  { column: "رقم الفاتورة", type: String, value: (row) => row.invoiceNumber, width: 16 },
  { column: "رقم الحاوية", type: String, value: (row) => row.number, width: 18 },
  { column: "نوع الحاوية", type: String, value: (row) => row.type, width: 16 },
  { column: "الميناء", type: String, value: (row) => row.port, width: 16 },
  { column: "حالة الحاوية", type: String, value: (row) => row.status, width: 14 },
  { column: "المورد", type: String, value: (row) => row.supplier, width: 20 },
  { column: "المستورد", type: String, value: (row) => row.importer, width: 20 },
  { column: "العملة", type: String, value: (row) => row.currency, width: 10 },
  { column: "مبلغ الفاتورة", type: Number, value: (row) => row.amount, width: 16, format: "#,##0.00" },
  { column: "المدفوع", type: Number, value: (row) => row.paid, width: 14, format: "#,##0.00" },
  {
    column: "المتبقي",
    type: Number,
    value: (row) => row.remaining,
    width: 14,
    format: "#,##0.00",
    getCellStyle: (row) => (row.remaining && row.remaining > 0 ? { fontWeight: "bold", color: "#8c2f28" } : undefined),
  },
  { column: "حالة الدفع", type: String, value: (row) => row.pay, width: 16 },
  { column: "رخصة الزراعة", type: String, value: (row) => row.agri, width: 22 },
  { column: "رخصة بيت إيل", type: String, value: (row) => row.beit, width: 22 },
  { column: "الدفعات", type: String, value: (row) => row.payments, width: 60, wrap: true },
  { column: "ملاحظة", type: String, value: (row) => row.note, width: 24, wrap: true },
];

function invoiceRows(ledger: Ledger, today: string): InvoiceRow[] {
  return ledger.invoices
    .slice()
    .sort((a, b) => compareArrival(invoiceArrival(a, ledger.containers), invoiceArrival(b, ledger.containers)) || a.number.localeCompare(b.number))
    .map((invoice) => {
      const eta = invoiceArrival(invoice, ledger.containers);
      return {
        eta: eta || "بدون موعد",
        when: arrivalWord(eta, today),
        containerNumber: invoice.containerNumber || "—",
        number: invoice.number,
        supplier: invoice.supplier,
        importer: invoice.importer,
        product: invoice.product || "—",
        currency: invoice.currency,
        amount: invoice.amount,
        paid: Math.round(paidSum(invoice.id, ledger.payments) * 100) / 100,
        remaining: remainingOf(invoice, ledger.payments),
        pay: payLabel[payState(invoice, ledger.payments)],
        agri: licenseCell(invoice.agriAvailable, invoice.agriLicense),
        beit: licenseCell(invoice.beitElAvailable, invoice.beitElLicense),
        note: invoice.note || "",
      };
    });
}

const invoiceSchema: Schema<InvoiceRow> = [
  { column: "موعد وصول الحاوية", type: String, value: (row) => row.eta, width: 20 },
  { column: "قرب الوصول", type: String, value: (row) => row.when, width: 16 },
  { column: "رقم الحاوية", type: String, value: (row) => row.containerNumber, width: 18 },
  { column: "رقم الفاتورة", type: String, value: (row) => row.number, width: 16 },
  { column: "المورد", type: String, value: (row) => row.supplier, width: 20 },
  { column: "الصنف", type: String, value: (row) => row.product, width: 28 },
  { column: "المستورد", type: String, value: (row) => row.importer, width: 20 },
  { column: "العملة", type: String, value: (row) => row.currency, width: 10 },
  { column: "مبلغ الفاتورة", type: Number, value: (row) => row.amount, width: 16, format: "#,##0.00" },
  { column: "المدفوع", type: Number, value: (row) => row.paid, width: 14, format: "#,##0.00" },
  {
    column: "المتبقي",
    type: Number,
    value: (row) => row.remaining,
    width: 14,
    format: "#,##0.00",
    getCellStyle: (row) => (row.remaining > 0 ? { fontWeight: "bold", color: "#8c2f28" } : undefined),
  },
  { column: "حالة الدفع", type: String, value: (row) => row.pay, width: 16 },
  { column: "رخصة الزراعة", type: String, value: (row) => row.agri, width: 22 },
  { column: "رخصة بيت إيل", type: String, value: (row) => row.beit, width: 22 },
  { column: "ملاحظة", type: String, value: (row) => row.note, width: 24, wrap: true },
];

function paymentRows(boxes: Container[], invoices: Invoice[], payments: Payment[]): PaymentRow[] {
  const rows: PaymentRow[] = [];
  const sorted = boxes.slice().sort((a, b) => compareArrival(a.eta, b.eta) || a.number.localeCompare(b.number));
  for (const box of sorted) {
    for (const invoice of invoicesFor(box, invoices)) {
      const lines = payments
        .filter((row) => row.invoiceId === invoice.id)
        .slice()
        .sort((a, b) => a.paidOn.localeCompare(b.paidOn) || a.id.localeCompare(b.id));
      let running = 0;
      lines.forEach((line, index) => {
        running = Math.round((running + line.amount) * 100) / 100;
        rows.push({
          eta: box.eta || "بدون موعد",
          containerNumber: box.number,
          invoiceNumber: invoice.number,
          title: ordinal(index),
          paidOn: line.paidOn,
          amount: line.amount,
          paid: running,
          remaining: Math.max(0, Math.round((invoice.amount - running) * 100) / 100),
          currency: invoice.currency,
          note: line.note || "",
        });
      });
    }
  }
  return rows;
}

const paymentSchema: Schema<PaymentRow> = [
  { column: "موعد وصول الحاوية", type: String, value: (row) => row.eta, width: 20 },
  { column: "رقم الحاوية", type: String, value: (row) => row.containerNumber, width: 18 },
  { column: "رقم الفاتورة", type: String, value: (row) => row.invoiceNumber, width: 16 },
  { column: "الدفعة", type: String, value: (row) => row.title, width: 16 },
  { column: "تاريخ الدفعة", type: String, value: (row) => row.paidOn, width: 16 },
  { column: "مبلغ الدفعة", type: Number, value: (row) => row.amount, width: 14, format: "#,##0.00" },
  { column: "المدفوع", type: Number, value: (row) => row.paid, width: 14, format: "#,##0.00" },
  { column: "المتبقي", type: Number, value: (row) => row.remaining, width: 14, format: "#,##0.00" },
  { column: "العملة", type: String, value: (row) => row.currency, width: 10 },
  { column: "ملاحظة", type: String, value: (row) => row.note, width: 24 },
];

const blankPayment: PaymentRow = {
  eta: "—",
  containerNumber: "—",
  invoiceNumber: "—",
  title: "لا دفعات",
  paidOn: "—",
  amount: 0,
  paid: 0,
  remaining: 0,
  currency: "—",
  note: "",
};

const blankInvoice: InvoiceRow = {
  eta: "—",
  when: "—",
  containerNumber: "—",
  number: "لا فواتير",
  supplier: "—",
  importer: "—",
  product: "—",
  currency: "—",
  amount: 0,
  paid: 0,
  remaining: 0,
  pay: "—",
  agri: "—",
  beit: "—",
  note: "",
};

const blankContainer: ContainerRow = {
  order: 0,
  eta: "—",
  when: "—",
  number: "لا حاويات",
  type: "—",
  port: "—",
  status: "—",
  invoiceNumber: "—",
  supplier: "—",
  importer: "—",
  currency: "—",
  amount: null,
  paid: null,
  remaining: null,
  pay: "—",
  agri: "—",
  beit: "—",
  payments: "—",
  note: "",
};

const names: Record<ExcelReport, string> = {
  arrival: "الحاويات-حسب-موعد-الوصول",
  soon: "الحاويات-القريبة-الوصول",
  unpaid: "الحاويات-الباقي-للدفع",
  paid: "الحاويات-المدفوعة",
  full: "الحاويات-تقرير-كامل",
};

export async function downloadExcelReport(kind: ExcelReport, ledger: Ledger) {
  const today = todayISO();
  const boxes = selectBoxes(kind, ledger, today);
  const lines = containerLines(boxes, ledger.invoices, ledger.payments, today);
  if (kind !== "full" && !lines.length) return "empty" as const;
  const pays = paymentRows(boxes, ledger.invoices, ledger.payments);
  const fileName = `${names[kind]}.xlsx`;
  const options = { headerStyle: header, fontSize: 12, rightToLeft: true, stickyRowsCount: 1, fileName };
  if (kind === "full") {
    const invoices = invoiceRows(ledger, today);
    if (!lines.length && !invoices.length) return "empty" as const;
    await writeXlsxFile(
      [lines.length ? lines : [blankContainer], invoices.length ? invoices : [blankInvoice], pays.length ? pays : [blankPayment]] as never,
      {
      ...options,
      schema: [containerSchema, invoiceSchema, paymentSchema] as never,
      sheets: ["الحاويات حسب الوصول", "الفواتير", "الدفعات"],
    });
    return "ok" as const;
  }
  await writeXlsxFile([lines, pays.length ? pays : [blankPayment]] as never, {
    ...options,
    schema: [containerSchema, paymentSchema] as never,
    sheets: ["الحاويات", "الدفعات"],
  });
  return "ok" as const;
}
