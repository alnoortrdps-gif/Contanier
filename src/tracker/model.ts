import { z } from "zod";

export const currencies = ["USD", "EUR", "ILS"] as const;
export const containerTypes = ["20 قدم", "40 قدم", "40 قدم مرتفع", "مبرد"] as const;
export const containerStatuses = ["transit", "arrived", "delivered", "hold", "reserved"] as const;

export const ledgerSections = ["meat", "fish"] as const;
export type LedgerSection = (typeof ledgerSections)[number];

export const sectionLabel: Record<LedgerSection, string> = {
  meat: "عجل وخاروف",
  fish: "سمك",
};

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  supplier: z.string(),
  importer: z.string(),
  product: z.string().default(""),
  quantity: z.string().default(""),
  amount: z.number(),
  currency: z.enum(currencies),
  status: z.enum(["pending", "paid"]),
  note: z.string(),
  containerNumber: z.string(),
  agriLicense: z.string().default(""),
  agriAvailable: z.boolean().default(false),
  beitElLicense: z.string().default(""),
  beitElAvailable: z.boolean().default(false),
  category: z.enum(ledgerSections).default("meat"),
});

export const containerSchema = z.object({
  id: z.string(),
  number: z.string(),
  type: z.string(),
  port: z.string(),
  status: z.enum(containerStatuses),
  eta: z.string(),
  invoiceNumber: z.string(),
  note: z.string(),
  category: z.enum(ledgerSections).default("meat"),
  broker: z.string().default(""),
  dhlAddress: z.string().default(""),
  dhlShipment: z.string().default(""),
  dhlStatus: z.string().default(""),
  dhlDate: z.string().default(""),
  docsRequested: z.boolean().default(false),
  docsArrived: z.boolean().default(false),
  telexRequested: z.boolean().default(false),
  telexState: z.string().default(""),
  emailRequested: z.boolean().default(false),
  docsEmail: z.string().default(""),
  telexEmail: z.string().default(""),
  docsBrokerDate: z.string().default(""),
  lineName: z.string().default(""),
  trackUrl: z.string().default(""),
  etaNote: z.string().default(""),
  etaChecked: z.string().default(""),
  customsNo: z.string().default(""),
  atCompany: z.boolean().default(false),
});

export const paymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amount: z.number(),
  paidOn: z.string(),
  note: z.string(),
  receipt: z.string().default(""),
});

export const ledgerSchema = z.object({
  invoices: z.array(invoiceSchema),
  containers: z.array(containerSchema),
  payments: z.array(paymentSchema).default([]),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type Container = z.infer<typeof containerSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Ledger = z.infer<typeof ledgerSchema>;
export type Currency = (typeof currencies)[number];
export type ContainerStatus = (typeof containerStatuses)[number];
export type PayState = "paid" | "partial" | "pending";

export const payLabel: Record<PayState, string> = {
  paid: "اندفعت",
  partial: "باقي للدفع",
  pending: "بانتظار الدفع",
};

export const boxLabel: Record<ContainerStatus, string> = {
  transit: "في الطريق",
  arrived: "وصلت",
  delivered: "تم التسليم",
  hold: "معلّقة",
  reserved: "محجوزة",
};

export function receivedAtCompany(box?: { atCompany?: boolean; customsNo?: string } | null) {
  return Boolean(box?.atCompany && box.customsNo?.trim());
}

export function arrivalBits(eta: string, today: string, status?: ContainerStatus) {
  const late = Boolean(eta) && dayDiff(eta, today) <= 0;
  if (status === "reserved" && late) return ["وصلت", "محجوزة"];
  if (status === "hold" && late) return ["وصلت", "معلّقة"];
  return [arrivalWord(eta, today, status)];
}

export function arrivalWord(eta: string, today: string, status?: ContainerStatus) {
  if (status === "reserved") return "محجوزة";
  if (status === "delivered") return "تم التسليم";
  if (status === "hold") return "معلّقة";
  if (!eta) return "بدون موعد";
  const left = dayDiff(eta, today);
  if (left <= 0) return "وصلت";
  if (left === 1) return "غداً";
  return `بعد ${left} يوم`;
}

export function currencyWord(code: string) {
  if (code === "USD") return "دولار";
  if (code === "EUR") return "يورو";
  if (code === "ILS") return "شيقل";
  return code;
}

export function parseTypedDate(value: string) {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const written = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  const year = Number(iso?.[1] ?? written?.[3]);
  const month = Number(iso?.[2] ?? written?.[2]);
  const day = Number(iso?.[3] ?? written?.[1]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}-${month}-${year}`;
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftISO(days: number, now = new Date()) {
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return todayISO(next);
}

export function beforeArrival(eta: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eta)) return "";
  const [year, month, day] = eta.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() - days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayDiff(from: string, to: string) {
  const a = from.split("-").map(Number);
  const b = to.split("-").map(Number);
  const da = Date.UTC(a[0] ?? 0, (a[1] ?? 1) - 1, a[2] ?? 1);
  const db = Date.UTC(b[0] ?? 0, (b[1] ?? 1) - 1, b[2] ?? 1);
  return Math.round((da - db) / 86400000);
}

export function paidSum(invoiceId: string, payments: Payment[]) {
  return payments.filter((row) => row.invoiceId === invoiceId).reduce((sum, row) => sum + row.amount, 0);
}

export function remainingOf(invoice: Invoice, payments: Payment[]) {
  const paid = paidSum(invoice.id, payments);
  const left = Math.max(0, Math.round((invoice.amount - paid) * 100) / 100);
  if (invoice.currency === "USD" && paid > 0 && left < 5) return 0;
  return left;
}

export function payState(invoice: Invoice, payments: Payment[]): PayState {
  const paid = paidSum(invoice.id, payments);
  if (paid > 0 && remainingOf(invoice, payments) === 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

export function money(amount: number) {
  return amount.toLocaleString("en-US", {
    numberingSystem: "latn",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
