import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { archiveArrived90611, ensureFishSeed, ensureSheetSeed, releaseArchiveWithoutCustoms, syncFishSheet, syncMeatArrivalOct19, syncMeatArrivalOct20, syncMeatOct17, syncMeatSheet, syncMeatVerify, syncSheetLinesOct28, syncSheetOct21, syncSheetOct22, syncSheetOct24, syncSheetPayOct22 } from "@/tracker/sheet-seed";
import { lineLabel } from "@/tracker/lines";
import { getSql } from "@/lib/db";
import { authMiddleware, sameSiteMiddleware } from "@/lib/auth/middleware";
import {
  containerStatuses,
  currencies,
  ledgerSections,
  ledgerSchema,
  todayISO,
  formatDate,
  currencyWord,
  type Container,
  type Invoice,
  type Ledger,
  type Payment,
} from "@/tracker/model";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const invoiceDraftSchema = z.object({
  number: z.string().trim().min(1).max(80),
  supplier: z.string().trim().min(1).max(160),
  importer: z.string().trim().min(1).max(160),
  product: z.string().trim().max(160),
  quantity: z.string().trim().max(80),
  amount: z.number().finite().nonnegative(),
  currency: z.enum(currencies),
  status: z.enum(["pending", "paid"]),
  note: z.string().max(500),
  containerNumber: z.string().trim().max(40),
  agriLicense: z.string().trim().max(80),
  agriAvailable: z.boolean(),
  beitElLicense: z.string().trim().max(80),
  beitElAvailable: z.boolean(),
  category: z.enum(ledgerSections),
});

const containerDraftSchema = z.object({
  number: z.string().trim().max(40),
  type: z.string().trim().min(1).max(40),
  port: z.string().max(120),
  status: z.enum(containerStatuses),
  eta: z.string(),
  invoiceNumber: z.string().max(80),
  note: z.string().max(500),
  category: z.enum(ledgerSections),
  broker: z.string().trim().max(120),
  dhlAddress: z.string().trim().max(200),
  dhlShipment: z.string().trim().max(80),
  docsRequested: z.boolean(),
  docsArrived: z.boolean(),
  telexRequested: z.boolean(),
  telexState: z.string().max(20).default(""),
  emailRequested: z.boolean(),
  docsEmail: z.string().trim().max(400).default(""),
  telexEmail: z.string().trim().max(400).default(""),
  docsBrokerDate: z.string().max(20).default(""),
  lineName: z.string().trim().max(80).default(""),
  trackUrl: z.string().trim().max(500).default(""),
  customsNo: z.string().trim().max(80).default(""),
  atCompany: z.boolean().default(false),
});

export type InvoiceDraft = z.infer<typeof invoiceDraftSchema>;
export type ContainerDraft = z.infer<typeof containerDraftSchema>;

const idSchema = z.object({ id: z.string().min(1).max(80) });

async function assertInvoiceRules(number: string, containerNumber: string, amount: number, supplier: string, id?: string) {
  if (!number.trim()) throw new Error("رقم الفاتورة مطلوب");
  if (amount < 0 || !Number.isFinite(amount)) throw new Error("المبلغ غير صحيح");
  const sql = await getSql();
  const dup = await sql<{ id: string }>`select id from invoices where number = ${number.trim()} and id <> ${id ?? ""}`;
  if (dup.length) throw new Error("رقم الفاتورة موجود");
}

async function assertAdmin(context: { role?: string | null }) {
  if (context.role !== "admin") throw new Error("هذا الحساب للعرض فقط");
}

async function filesTable(sql: { query: (text: string, params?: unknown[]) => Promise<unknown> }) {
  await sql.query(
    "create table if not exists invoice_files (id text primary key, invoice_id text not null, kind text not null, filename text not null default '', data text not null default '', unique (invoice_id, kind))",
  );
}

const fileKind = z.enum(["proforma", "original", "packing", "telex"]);

export const loadFileIndex = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await filesTable(sql);
    const rows = await sql<{ invoice_id: string; kind: string; filename: string }>`
      select invoice_id, kind, filename from invoice_files
    `;
    return rows.map((row) => ({ invoiceId: row.invoice_id, kind: row.kind, filename: row.filename }));
  });

export const loadInvoiceFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ invoiceId: z.string().min(1).max(80), kind: fileKind }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await filesTable(sql);
    const rows = await sql<{ data: string; filename: string }>`
      select data, filename from invoice_files where invoice_id = ${data.invoiceId} and kind = ${data.kind}
    `;
    return rows[0] ?? null;
  });

export const saveInvoiceFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      invoiceId: z.string().min(1).max(80),
      kind: fileKind,
      filename: z.string().trim().max(180),
      data: z.string().min(20).max(9_000_000),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.data.startsWith("data:application/pdf")) throw new Error("الملف لازم يكون PDF");
    const sql = await getSql();
    await filesTable(sql);
    const id = `${data.invoiceId}-${data.kind}`;
    await sql.query(
      `insert into invoice_files (id, invoice_id, kind, filename, data) values ($1,$2,$3,$4,$5)
       on conflict (invoice_id, kind) do update set filename = excluded.filename, data = excluded.data`,
      [id, data.invoiceId, data.kind, data.filename || "file.pdf", data.data],
    );
    const names = { proforma: "بروفرما", original: "فاتورة أصلية", packing: "قائمة التعبئة", telex: "تيليكس" };
    await writeLog(context.username, "ملف", `${names[data.kind]} على ${data.invoiceId}`);
    return { ok: true };
  });

export const removeInvoiceFile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ invoiceId: z.string().min(1).max(80), kind: fileKind }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await filesTable(sql);
    await sql`delete from invoice_files where invoice_id = ${data.invoiceId} and kind = ${data.kind}`;
    await writeLog(context.username, "ملف", `حذف ${data.kind}`);
    return { ok: true };
  });

async function writeLog(username: string | undefined, action: string, detail: string) {
  const sql = await getSql();
  await sql.query(
    "create table if not exists activity_log (id text primary key, username text not null default '', action text not null, detail text not null default '', created_at timestamptz not null default now())",
  );
  await sql`insert into activity_log (id, username, action, detail) values (${crypto.randomUUID()}, ${username || "—"}, ${action}, ${detail})`;
}

function logTime(value: unknown) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (!Number.isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  const text = String(value);
  const match = text.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : text.slice(0, 16);
}

export const loadLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await sql.query(
      "create table if not exists activity_log (id text primary key, username text not null default '', action text not null, detail text not null default '', created_at timestamptz not null default now())",
    );
    const rows = await sql<{ id: string; username: string; action: string; detail: string; created_at: string }>`
      select id, username, action, detail, created_at from activity_log order by created_at desc limit 40
    `;
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      action: row.action,
      detail: row.detail,
      createdAt: logTime(row.created_at),
    }));
  });

export const loadAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return {
      role: context.role === "admin" || context.role === "viewer" ? context.role : null,
      username: context.username ?? "",
    };
  });

export const loginRole = createServerFn({ method: "POST" })
  .middleware([sameSiteMiddleware])
  .validator(z.object({ username: z.string().trim().min(1).max(40), password: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const { loginRoleAccount } = await import("@/tracker/role.server");
    const access = await loginRoleAccount(data.username, data.password);
    if (!access) throw new Error("اسم المستخدم أو كلمة السر غير صحيحة");
    return access;
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    current: z.string().min(1).max(40),
    next: z.string().min(4).max(40),
  }))
  .handler(async ({ data, context }) => {
    const { changeRolePassword } = await import("@/tracker/role.server");
    const ok = await changeRolePassword(context.username ?? "", data.current, data.next);
    if (!ok) throw new Error("كلمة السر الحالية غير صحيحة");
    return { ok: true };
  });

export const loadDailyChecks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const today = todayISO();
    await sql.query("create table if not exists daily_checks (invoice_id text not null, checked_on text not null, primary key (invoice_id, checked_on))");
    const rows = await sql<{ invoice_id: string }>`select invoice_id from daily_checks where checked_on = ${today}`;
    return rows.map((row) => row.invoice_id);
  });

export const markDailyReady = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ invoiceId: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const today = todayISO();
    await sql.query("create table if not exists daily_checks (invoice_id text not null, checked_on text not null, primary key (invoice_id, checked_on))");
    await sql`
      insert into daily_checks (invoice_id, checked_on) values (${data.invoiceId}, ${today})
      on conflict (invoice_id, checked_on) do nothing
    `;
    await writeLog(context.username, "تشييك", `جاهز اليوم ${data.invoiceId}`);
    return { ok: true };
  });

export const logoutRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { logoutRoleToken } = await import("@/tracker/role.server");
    await logoutRoleToken(context.roleToken);
    return { ok: true };
  });

type InvoiceRow = {
  id: string;
  number: string;
  supplier: string;
  importer: string;
  product: string;
  quantity: string;
  amount: number;
  currency: Invoice["currency"];
  status: Invoice["status"];
  note: string;
  container_number: string;
  agri_license: string;
  agri_available: boolean | string | number;
  beitel_license: string;
  beitel_available: boolean | string | number;
  category: Invoice["category"];
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount: number;
  paid_on: string;
  note: string;
  receipt: string;
};

type ContainerRow = {
  id: string;
  number: string;
  type: string;
  port: string;
  status: Container["status"];
  eta: string | null;
  invoice_number: string;
  note: string;
  category: Container["category"];
  broker: string;
  dhl_address: string;
  dhl_shipment: string;
  dhl_status: string;
  dhl_date: string;
  docs_requested: boolean | string | number;
  docs_arrived: boolean | string | number;
  telex_requested: boolean | string | number;
  telex_state: string;
  email_requested: boolean | string | number;
  docs_email: string;
  telex_email: string;
  docs_broker_date: string;
  line_name: string;
  track_url: string;
  eta_note: string;
  eta_checked: string;
  eta_snapshot: string;
  customs_no: string;
  at_company: boolean | string | number;
};

function asFlag(value: boolean | string | number) {
  return value === true || value === "t" || value === "true" || value === 1;
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    number: row.number,
    supplier: row.supplier ?? "",
    importer: row.importer ?? "",
    product: row.product ?? "",
    quantity: row.quantity ?? "",
    amount: Number(row.amount),
    currency: row.currency === "EUR" || row.currency === "ILS" ? row.currency : "USD",
    status: row.status,
    note: row.note ?? "",
    containerNumber: row.container_number ?? "",
    agriLicense: row.agri_license ?? "",
    agriAvailable: asFlag(row.agri_available),
    beitElLicense: row.beitel_license ?? "",
    beitElAvailable: asFlag(row.beitel_available),
    category: row.category === "fish" ? "fish" : "meat",
  };
}

function mapContainer(row: ContainerRow): Container {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    port: row.port ?? "",
    status: row.status,
    eta: row.eta ? String(row.eta).slice(0, 10) : "",
    invoiceNumber: row.invoice_number ?? "",
    note: row.note ?? "",
    category: row.category === "fish" ? "fish" : "meat",
    broker: row.broker ?? "",
    dhlAddress: row.dhl_address ?? "",
    dhlShipment: row.dhl_shipment ?? "",
    dhlStatus: row.dhl_status ?? "",
    dhlDate: row.dhl_date ?? "",
    docsRequested: asFlag(row.docs_requested),
    docsArrived: asFlag(row.docs_arrived),
    telexRequested: asFlag(row.telex_requested),
    telexState: row.telex_state || (asFlag(row.email_requested) ? "emailed" : asFlag(row.telex_requested) ? "waiting" : ""),
    emailRequested: asFlag(row.email_requested),
    docsEmail: row.docs_email ?? "",
    telexEmail: row.telex_email ?? "",
    docsBrokerDate: row.docs_broker_date ? String(row.docs_broker_date).slice(0, 10) : "",
    lineName: row.line_name || lineLabel(row.number),
    trackUrl: row.track_url ?? "",
    etaNote: row.eta_note ?? "",
    etaChecked: row.eta_checked ? String(row.eta_checked).slice(0, 10) : "",
    customsNo: row.customs_no ?? "",
    atCompany: asFlag(row.at_company),
  };
}

function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amount: Number(row.amount),
    paidOn: String(row.paid_on).slice(0, 10),
    note: row.note ?? "",
    receipt: row.receipt ?? "",
  };
}
function etaValue(eta: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(eta) ? eta : null;
}

function dayFromStamp(value: string) {
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

async function trackDhl(number: string) {
  const key = process.env.DHL_API_KEY;
  const url = key
    ? `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(number)}`
    : `https://www.dhl.com/utapi?trackingNumber=${encodeURIComponent(number)}&language=ar&requesterCountryCode=JO&source=tt`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(key ? { "DHL-API-Key": key } : { "User-Agent": "Mozilla/5.0" }),
    },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    shipments?: {
      status?: { statusCode?: string; status?: string; description?: string };
      estimatedTimeOfDelivery?: string;
      events?: { timestamp?: string; statusCode?: string; status?: string }[];
    }[];
  };
  const shipment = body.shipments?.[0];
  if (!shipment) return null;
  const code = `${shipment.status?.statusCode || ""} ${shipment.status?.status || ""} ${shipment.status?.description || ""}`.toLowerCase();
  const delivered = /deliver|تم التسليم|وصلت|success/.test(code);
  const eventDate = shipment.events?.find((event) => /deliver/.test(`${event.statusCode || ""} ${event.status || ""}`.toLowerCase()))?.timestamp
    || shipment.events?.[0]?.timestamp
    || shipment.estimatedTimeOfDelivery
    || "";
  return {
    status: delivered ? "وصلت" : "بالطريق",
    date: dayFromStamp(eventDate),
    delivered,
  };
}

async function refreshDaily(sql: Awaited<ReturnType<typeof getSql>>) {
  const today = todayISO();
  const watched = await sql<{ id: string; number: string; eta: string | null; eta_snapshot: string; eta_checked: string; line_name: string }>`
    select id, number, eta, eta_snapshot, eta_checked, line_name from containers
  `;
  for (const box of watched) {
    const checked = box.eta_checked ? String(box.eta_checked).slice(0, 10) : "";
    if (checked === today) continue;
    const current = box.eta ? String(box.eta).slice(0, 10) : "";
    const previous = box.eta_snapshot ? String(box.eta_snapshot).slice(0, 10) : "";
    const line = box.line_name || lineLabel(box.number);
    let note = "";
    if (previous && current && previous !== current) note = `تغير موعد الوصول من ${formatDate(previous)} إلى ${formatDate(current)}`;
    else if (previous && !current) note = `انمسح موعد الوصول، كان ${formatDate(previous)}`;
    await sql`
      update containers set
        line_name = ${line},
        eta_note = ${note},
        eta_checked = ${today},
        eta_snapshot = ${current}
      where id = ${box.id}
    `;
    if (previous && current && previous !== current) {
      await writeLog("النظام", "حاوية", `${box.number}: ${note}`);
    }
  }
  const tracked = await sql<{ id: string; dhl_shipment: string; dhl_checked: string }>`
    select id, dhl_shipment, dhl_checked from containers where dhl_shipment <> ''
  `;
  let checks = 0;
  for (const box of tracked) {
    if (box.dhl_checked === today || checks >= 8) continue;
    checks += 1;
    let result: { status: string; date: string; delivered: boolean } | null = null;
    try {
      result = await Promise.race([
        trackDhl(box.dhl_shipment),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4500)),
      ]);
    } catch {
      result = null;
    }
    if (!result) {
      await sql`update containers set dhl_status = 'لسا ما في تاريخ', dhl_checked = ${today} where id = ${box.id}`;
      continue;
    }
    if (result.delivered) {
      await sql`
        update containers set dhl_status = ${result.status}, dhl_date = ${result.date}, dhl_checked = ${today}, docs_arrived = true
        where id = ${box.id}
      `;
    } else {
      await sql`
        update containers set dhl_status = ${result.status}, dhl_date = ${result.date}, dhl_checked = ${today}
        where id = ${box.id}
      `;
    }
  }
}

export const loadLedger = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<Ledger> => {
    const sql = await getSql();
    await ensureSheetSeed(sql);
    await ensureFishSeed(sql);
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const filled = await sql<{ key: string }>`select key from app_flags where key = 'product-from-note-v1'`;
    if (!filled.length) {
      await sql`update invoices set product = note where product = '' and note <> ''`;
      await sql.query("insert into app_flags (key, value) values ('product-from-note-v1', '1') on conflict (key) do nothing");
    }
    const docsFlag = await sql<{ key: string }>`select key from app_flags where key = 'docs-fields-v1'`;
    if (!docsFlag.length) {
      const boxes = await sql<{ id: string; note: string; broker: string; dhl_address: string }>`
        select id, note, broker, dhl_address from containers
      `;
      for (const box of boxes) {
        const dhl = box.dhl_address || box.note.match(/DHL:\s*([^·\n]+)/i)?.[1]?.trim() || "";
        if (dhl && dhl !== box.dhl_address) {
          await sql`update containers set dhl_address = ${dhl} where id = ${box.id}`;
        }
      }
      await sql.query("insert into app_flags (key, value) values ('docs-fields-v1', '1') on conflict (key) do nothing");
    }
    const brokerFlag = await sql<{ key: string }>`select key from app_flags where key = 'broker-manual-v1'`;
    if (!brokerFlag.length) {
      await sql`update containers set broker = ''`;
      await sql.query("insert into app_flags (key, value) values ('broker-manual-v1', '1') on conflict (key) do nothing");
    }
    await sql.query("alter table invoices add column if not exists quantity text not null default ''");
    await sql.query("alter table containers add column if not exists telex_requested boolean not null default false");
    await sql.query("alter table containers add column if not exists telex_state text not null default ''");
    await sql.query("alter table containers add column if not exists email_requested boolean not null default false");
    await sql.query("alter table containers add column if not exists dhl_status text not null default ''");
    await sql.query("alter table containers add column if not exists dhl_date text not null default ''");
    await sql.query("alter table containers add column if not exists dhl_checked text not null default ''");
    await sql.query("alter table containers add column if not exists docs_email text not null default ''");
    await sql.query("alter table containers add column if not exists telex_email text not null default ''");
    await sql.query("alter table containers add column if not exists docs_broker_date text not null default ''");
    await sql.query("alter table containers add column if not exists line_name text not null default ''");
    await sql.query("alter table containers add column if not exists track_url text not null default ''");
    await sql.query("alter table containers add column if not exists eta_note text not null default ''");
    await sql.query("alter table containers add column if not exists eta_checked text not null default ''");
    await sql.query("alter table containers add column if not exists eta_snapshot text not null default ''");
    await sql.query("alter table containers add column if not exists customs_no text not null default ''");
    await sql.query("alter table containers add column if not exists at_company boolean not null default false");
    try {
      await syncMeatSheet(sql);
      await syncMeatVerify(sql);
      await syncMeatOct17(sql);
      await syncMeatArrivalOct19(sql);
      await syncMeatArrivalOct20(sql);
      await syncSheetOct21(sql);
      await syncSheetOct22(sql);
      await syncSheetPayOct22(sql);
      await archiveArrived90611(sql);
      await releaseArchiveWithoutCustoms(sql);
      await syncFishSheet(sql);
    } catch (error) {
      console.error(error);
    }
    try {
      await syncSheetOct24(sql);
    } catch (error) {
      console.error(error);
    }
    const cleared = await sql<{ key: string }>`select key from app_flags where key = 'clear-189026-full'`;
    if (!cleared.length) {
      await sql.query(
        `delete from payments where invoice_id in (select id from invoices where number = '189026') and amount >= 100000`,
      );
      await sql.query("insert into app_flags (key, value) values ('clear-189026-full', '1') on conflict (key) do nothing");
    }
    void refreshDaily(sql).catch(() => undefined);
    await sql.query(
      `update containers set status = 'transit'
       where status = 'arrived' and coalesce(at_company, false) = false
         and not exists (select 1 from app_flags where key = 'follow-until-company')`,
    ).catch(() => undefined);
    await sql.query("insert into app_flags (key, value) values ('follow-until-company', '1') on conflict (key) do nothing").catch(() => undefined);
    await sql.query(
      `update invoices set product = 'دهن عجل - دوجلوس 28 طن - ناتو'
       where number = '188926' and coalesce(category, 'meat') <> 'fish' and product like '%لسان%'`,
    ).catch(() => undefined);
    try {
      await syncSheetLinesOct28(sql);
    } catch (error) {
      console.error(error);
    }
    const invoices = await sql<InvoiceRow>`
      select id, number, supplier, importer, product, quantity, amount, currency, status, note, container_number,
        agri_license, agri_available, beitel_license, beitel_available, category
      from invoices
      order by created_at desc
    `;
    const containers = await sql<ContainerRow>`
      select id, number, type, port, status, eta, invoice_number, note, category, broker, dhl_address, dhl_shipment, dhl_status, dhl_date, docs_requested, docs_arrived, telex_requested, telex_state, email_requested, docs_email, telex_email, docs_broker_date, line_name, track_url, eta_note, eta_checked, eta_snapshot, customs_no, at_company
      from containers
      order by created_at desc
    `;
    const payments = await sql<PaymentRow>`
      select id, invoice_id, amount, paid_on, note, receipt
      from payments
      order by paid_on desc, created_at desc
    `;
    const sheetEta: Record<string, string> = {
      "89977": "2026-11-03",
      ALC263729: "2026-11-16",
      ALC264448: "2026-11-16",
      "AR/19878": "2026-12-10",
      "91321": "2026-12-19",
      "91357-1": "2026-12-12",
      "91357-2": "2026-11-16",
      ALC264447: "2026-10-29",
      "180526": "2026-10-27",
      "180626": "2026-11-30",
      "83776-1RS": "2026-12-06",
      "84583-8S": "2026-12-06",
      "83208-6S": "2026-12-06",
      "185626": "2026-12-14",
      "189026": "2026-12-12",
      "188926": "2026-12-12",
    };
    const fishEta: Record<string, string> = {
      "FTF0605-NAF02-26": "2026-11-11",
      "026/096": "2026-11-19",
      "7": "2026-10-31",
      "8": "2026-10-31",
      "13": "2026-10-31",
      "14": "2026-10-31",
      "PROFORMA 60851": "2026-11-30",
      "026/101": "2026-12-10",
      "9108": "2026-11-28",
    };
    const fishBox: Record<string, string> = {
      "7": "SUDU6171226",
      "8": "MNBU9146710",
      "13": "SUDU6103772",
      "14": "MNBU9014288",
    };
    const today = todayISO();
    for (const invoice of invoices) {
      if (invoice.category === "fish" && invoice.number.trim() === "PI NAF03" && !invoice.note.includes("بداية شهر 11")) {
        invoice.note = invoice.note ? `${invoice.note} · التحميل بداية شهر 11` : "التحميل بداية شهر 11";
        await sql.query(`update invoices set note = $1 where id = $2`, [invoice.note, invoice.id]).catch(() => undefined);
      }
      const wantedBox = invoice.category === "fish" ? fishBox[invoice.number.trim()] : "";
      if (wantedBox) {
        const stored = (invoice.container_number || "").trim();
        if (!stored || stored === invoice.number.trim()) {
          invoice.container_number = wantedBox;
          await sql.query(`update invoices set container_number = $1 where id = $2`, [wantedBox, invoice.id]).catch(() => undefined);
        }
        const linked =
          containers.find((row) => row.invoice_number === invoice.number && row.category === "fish") ??
          containers.find((row) => row.number === stored || row.number === wantedBox);
        if (linked && (!linked.number.trim() || linked.number.trim() === invoice.number.trim())) {
          linked.number = wantedBox;
          linked.invoice_number = invoice.number;
          await sql.query(`update containers set number = $1, invoice_number = $2 where id = $3`, [wantedBox, invoice.number, linked.id]).catch(() => undefined);
        }
      }
      const eta = invoice.category === "fish" ? fishEta[invoice.number.trim()] : sheetEta[invoice.number.trim()];
      if (!eta) continue;
      let box =
        containers.find((row) => row.number && row.number === invoice.container_number) ??
        containers.find((row) => row.invoice_number && row.invoice_number === invoice.number);
      const current = box && /^\d{4}-\d{2}-\d{2}/.test(String(box.eta ?? "")) ? String(box.eta).slice(0, 10) : "";
      if (box && current === eta) continue;
      const note = current
        ? `تغير موعد الوصول من ${current.split("-").reverse().join("-")} إلى ${eta.split("-").reverse().join("-")}`
        : `تغير موعد الوصول، صار ${eta.split("-").reverse().join("-")}`;
      if (!box) {
        const id = crypto.randomUUID();
        box = {
          id,
          number: invoice.container_number || "",
          type: "40 قدم",
          port: "",
          status: "transit",
          eta,
          invoice_number: invoice.number,
          note: "",
          category: invoice.category,
          broker: "",
          dhl_address: "",
          dhl_shipment: "",
          dhl_status: "",
          dhl_date: "",
          docs_requested: false,
          docs_arrived: false,
          telex_requested: false,
          telex_state: "",
          email_requested: false,
          docs_email: "",
          telex_email: "",
          docs_broker_date: "",
          line_name: "",
          track_url: "",
          eta_note: note,
          eta_checked: today,
          eta_snapshot: eta,
          customs_no: "",
          at_company: false,
        };
        containers.unshift(box);
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, eta_note, eta_snapshot, eta_checked)
           values ($1,$2,$3,'40 قدم','','transit',$4,$5,'',$6,$7,$4,$8)`,
          [id, "sheet", box.number, eta, invoice.number, invoice.category, note, today],
        ).catch(() => undefined);
        continue;
      }
      box.eta = eta;
      box.eta_note = note;
      await sql.query(
        `update containers set eta = $1, eta_note = $2, eta_snapshot = $1, eta_checked = $3 where id = $4`,
        [eta, note, today, box.id],
      ).catch(() => undefined);
    }
    return {
      invoices: invoices.map(mapInvoice),
      containers: containers.map(mapContainer),
      payments: payments.map(mapPayment),
    };
  });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(invoiceDraftSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertInvoiceRules(data.number, data.containerNumber, data.amount, data.supplier);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into invoices (
        id, user_id, number, supplier, importer, product, quantity, amount, currency, status, note, container_number,
        agri_license, agri_available, beitel_license, beitel_available, category
      )
      values (
        ${id},
        ${context.userId},
        ${data.number},
        ${data.supplier},
        ${data.importer},
        ${data.product},
        ${data.quantity},
        ${data.amount},
        ${data.currency},
        ${data.status},
        ${data.note},
        ${data.containerNumber},
        ${data.agriLicense},
        ${data.agriAvailable},
        ${data.beitElLicense},
        ${data.beitElAvailable},
        ${data.category}
      )
    `;
    await writeLog(context.username, "فاتورة", `إضافة ${data.number}`);
    return { id };
  });

export const updateInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(invoiceDraftSchema.extend({ id: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertInvoiceRules(data.number, data.containerNumber, data.amount, data.supplier, data.id);
    const sql = await getSql();
    const beforeAmount = await sql<{ amount: string | number }>`select amount from invoices where id = ${data.id}`;
    const oldAmount = Number(beforeAmount[0]?.amount ?? data.amount);
    const rows = await sql<{ id: string }>`
      update invoices set
        number = ${data.number},
        supplier = ${data.supplier},
        importer = ${data.importer},
        product = ${data.product},
        quantity = ${data.quantity},
        amount = ${data.amount},
        currency = ${data.currency},
        status = ${data.status},
        note = ${data.note},
        container_number = ${data.containerNumber},
        agri_license = ${data.agriLicense},
        agri_available = ${data.agriAvailable},
        beitel_license = ${data.beitElLicense},
        beitel_available = ${data.beitElAvailable},
        category = ${data.category}
      where id = ${data.id}
      returning id
    `;
    if (!rows.length) throw new Error("الفاتورة غير موجودة");
    if (Math.abs(oldAmount - data.amount) > 0.009) {
      await writeLog(context.username, "فاتورة", `تغيّر مبلغ ${data.number} من ${oldAmount} إلى ${data.amount}`);
    } else {
      await writeLog(context.username, "فاتورة", `تحديث ${data.number}`);
    }
    return { id: data.id };
  });

export const removeInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql`delete from payments where invoice_id = ${data.id}`;
    await sql.query("create table if not exists invoice_files (id text primary key, invoice_id text not null, kind text not null, filename text not null default '', data text not null default '')");
    await sql`delete from invoice_files where invoice_id = ${data.id}`;
    const gone = await sql<{ number: string }>`delete from invoices where id = ${data.id} returning number`;
    await writeLog(context.username, "فاتورة", `حذف ${gone[0]?.number ?? ""}`);
    return { ok: true };
  });

const paymentDraftSchema = z.object({
  invoiceId: z.string().min(1).max(80),
  amount: z.number().finite().positive(),
  paidOn: day,
  note: z.string().max(200),
  receipt: z.string().max(1_500_000).default(""),
});

export const addPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(paymentDraftSchema)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const invoices = await sql<{ amount: number; number: string; currency: string }>`
      select amount, number, currency from invoices where id = ${data.invoiceId}
    `;
    const invoice = invoices[0];
    if (!invoice) throw new Error("الفاتورة غير موجودة");
    const sums = await sql<{ paid: number }>`
      select coalesce(sum(amount), 0) as paid
      from payments
      where invoice_id = ${data.invoiceId}
    `;
    const paid = Number(sums[0]?.paid ?? 0);
    const left = Math.round((Number(invoice.amount) - paid) * 100) / 100;
    if (data.amount - left > 0.009) throw new Error("المبلغ أكبر من المتبقي");
    const id = crypto.randomUUID();
    await sql`
      insert into payments (id, user_id, invoice_id, amount, paid_on, note, receipt)
      values (${id}, ${context.userId}, ${data.invoiceId}, ${data.amount}, ${data.paidOn}, ${data.note}, ${data.receipt})
    `;
    const who = context.username || "المدير";
    await writeLog(who, "دفعة", `${who} أضاف دفعة ${data.amount} ${currencyWord(invoice.currency)} بتاريخ ${formatDate(data.paidOn)} على فاتورة ${invoice.number}`);
    return { id };
  });

export const updatePayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(paymentDraftSchema.extend({ id: z.string().min(1).max(80), password: z.string() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.password !== "2841989") throw new Error("كلمة السر غلط");
    const sql = await getSql();
    const current = await sql<{ invoice_id: string; receipt: string }>`
      select invoice_id, receipt from payments where id = ${data.id}
    `;
    if (!current[0]) throw new Error("الدفعة غير موجودة");
    const invoices = await sql<{ amount: number; number: string; currency: string }>`
      select amount, number, currency from invoices where id = ${current[0].invoice_id}
    `;
    const invoice = invoices[0];
    if (!invoice) throw new Error("الفاتورة غير موجودة");
    const sums = await sql<{ paid: number }>`
      select coalesce(sum(amount), 0) as paid from payments where invoice_id = ${current[0].invoice_id} and id <> ${data.id}
    `;
    const left = Math.round((Number(invoice.amount) - Number(sums[0]?.paid ?? 0)) * 100) / 100;
    if (data.amount - left > 0.009) throw new Error("المبلغ أكبر من المتبقي");
    const receipt = data.receipt || current[0].receipt || "";
    await sql`
      update payments set amount = ${data.amount}, paid_on = ${data.paidOn}, note = ${data.note}, receipt = ${receipt}
      where id = ${data.id}
    `;
    await writeLog(context.username, "دفعة", `${context.username || "المسؤول"} عدّل دفعة فاتورة ${invoice.number} إلى ${data.amount} ${currencyWord(invoice.currency)} بتاريخ ${formatDate(data.paidOn)}`);
    return { ok: true };
  });

export const removePayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    const gone = await sql<{ amount: number; invoice_id: string }>`
      delete from payments where id = ${data.id} returning amount, invoice_id
    `;
    if (!gone[0]) throw new Error("الدفعة غير موجودة");
    const invoices = await sql<{ number: string }>`select number from invoices where id = ${gone[0].invoice_id}`;
    await writeLog(context.username, "دفعة", `حذف دفعة ${gone[0].amount} من فاتورة ${invoices[0]?.number ?? ""}`);
    return { ok: true };
  });

export const markInvoicePaid = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql`
      update invoices set status = 'paid'
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const createContainer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(containerDraftSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, broker, dhl_address, dhl_shipment, docs_requested, docs_arrived, telex_requested, telex_state, email_requested, docs_email, telex_email, docs_broker_date, line_name, track_url, customs_no, at_company)
      values (
        ${id},
        ${context.userId},
        ${data.number},
        ${data.type},
        ${data.port},
        ${data.status},
        ${etaValue(data.eta)},
        ${data.invoiceNumber},
        ${data.note},
        ${data.category},
        ${data.broker},
        ${data.dhlAddress},
        ${data.dhlShipment},
        ${data.docsRequested},
        ${data.docsArrived},
        ${data.telexState ? data.telexState !== "" : data.telexRequested},
        ${data.telexState || ""},
        ${data.telexState === "emailed" || data.emailRequested},
        ${data.docsEmail || ""},
        ${data.telexEmail || ""},
        ${data.docsBrokerDate || ""},
        ${data.lineName || lineLabel(data.number)},
        ${data.trackUrl || ""},
        ${data.customsNo || ""},
        ${Boolean(data.atCompany)}
      )
    `;
    await writeLog(context.username, "حاوية", `إضافة ${data.number}`);
    return { id };
  });

export const updateContainer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(containerDraftSchema.extend({ id: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    const beforeEta = await sql<{ eta: string | null }>`select eta from containers where id = ${data.id}`;
    const oldEta = beforeEta[0]?.eta ? String(beforeEta[0].eta).slice(0, 10) : "";
    const rows = await sql<{ id: string }>`
      update containers set
        number = ${data.number},
        type = ${data.type},
        port = ${data.port},
        status = ${data.status},
        eta = ${etaValue(data.eta)},
        invoice_number = ${data.invoiceNumber},
        note = ${data.note},
        category = ${data.category},
        broker = ${data.broker},
        dhl_address = ${data.dhlAddress},
        dhl_shipment = ${data.dhlShipment},
        docs_requested = ${data.docsRequested},
        docs_arrived = ${data.docsArrived},
        telex_requested = ${Boolean(data.telexState) || data.telexRequested},
        telex_state = ${data.telexState || ""},
        email_requested = ${data.telexState === "emailed" || data.emailRequested},
        docs_email = ${data.docsEmail || ""},
        telex_email = ${data.telexEmail || ""},
        docs_broker_date = ${data.docsBrokerDate || ""},
        line_name = ${data.lineName || lineLabel(data.number)},
        track_url = ${data.trackUrl || ""},
        customs_no = ${data.customsNo || ""},
        at_company = ${Boolean(data.atCompany)}
      where id = ${data.id}
      returning id
    `;
    if (!rows.length) throw new Error("الحاوية غير موجودة");
    const nextEta = data.eta || "";
    if (oldEta !== nextEta) {
      const note = nextEta
        ? `تغير موعد الوصول من ${formatDate(oldEta)} إلى ${formatDate(nextEta)}`
        : `انمسح موعد الوصول، كان ${formatDate(oldEta)}`;
      await sql`update containers set eta_note = ${note}, eta_snapshot = ${nextEta}, eta_checked = ${todayISO()} where id = ${data.id}`;
      await writeLog(context.username, "حاوية", `تغيّر وصول ${data.number} من ${oldEta || "بدون"} إلى ${nextEta || "بدون"}`);
    } else {
      const paper = data.docsArrived ? "الأوراق وصلت" : data.docsRequested ? "تم طلب الأوراق" : "تعديل";
      await writeLog(context.username, "حاوية", `${data.number} — ${paper}`);
    }
    return { id: data.id };
  });

export const checkContainerEta = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ number: z.string().trim().min(1).max(40) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ eta: string | null; eta_snapshot: string; eta_note: string; invoice_number: string }>`
      select eta, eta_snapshot, eta_note, invoice_number from containers where number = ${data.number} limit 1
    `;
    const box = rows[0];
    if (!box) return { found: false, changed: false, message: "ما في حاوية بهالرقم" };
    const current = box.eta ? String(box.eta).slice(0, 10) : "";
    const previous = box.eta_snapshot ? String(box.eta_snapshot).slice(0, 10) : "";
    const savedNote = box.eta_note || "";
    if (savedNote.startsWith("تغير") || (previous && current && previous !== current)) {
      const message = savedNote.startsWith("تغير")
        ? `فاتورة ${box.invoice_number || "—"}: ${savedNote}`
        : `فاتورة ${box.invoice_number || "—"}: تغير موعد الوصول من ${formatDate(previous)} إلى ${formatDate(current)}`;
      return { found: true, changed: true, message };
    }
    return {
      found: true,
      changed: false,
      message: current ? `الموعد ${formatDate(current)} ما تغيّر` : "ما في موعد وصول محفوظ",
    };
  });

export const removeContainer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(idSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    const gone = await sql<{ number: string }>`delete from containers where id = ${data.id} returning number`;
    await writeLog(context.username, "حاوية", `حذف ${gone[0]?.number ?? ""}`);
    return { ok: true };
  });

export const loadCompany = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const rows = await sql<{ value: string }>`select value from app_flags where key = 'company'`;
    return rows[0]?.value ?? "";
  });

export const loadAlertPhone = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const rows = await sql<{ value: string }>`select value from app_flags where key = 'alert_phone'`;
    return rows[0]?.value ?? "";
  });

export const saveAlertPhone = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ phone: z.string().trim().max(20) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    await sql.query("insert into app_flags (key, value) values ('alert_phone', $1) on conflict (key) do update set value = excluded.value", [
      data.phone,
    ]);
    return { ok: true };
  });

export const loadAutoArrive = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const rows = await sql<{ value: string }>`select value from app_flags where key = 'auto-arrive'`;
    return rows[0]?.value !== "0";
  });

export const saveAutoArrive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ on: z.boolean() }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    await sql.query("insert into app_flags (key, value) values ('auto-arrive', $1) on conflict (key) do update set value = excluded.value", [
      data.on ? "1" : "0",
    ]);
    return { ok: true };
  });

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ name: z.string().trim().max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    await sql.query("insert into app_flags (key, value) values ('company', $1) on conflict (key) do update set value = excluded.value", [
      data.name,
    ]);
    return { ok: true };
  });

const partyList = z.array(z.string().trim().min(1).max(80)).max(40);

async function readPartyList(key: string, fallback: string[]) {
  const sql = await getSql();
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const rows = await sql<{ value: string }>`select value from app_flags where key = ${key}`;
  if (!rows[0]) {
    await sql.query("insert into app_flags (key, value) values ($1, $2) on conflict (key) do nothing", [key, JSON.stringify(fallback)]);
    return fallback;
  }
  try {
    const parsed = partyList.parse(JSON.parse(rows[0].value));
    return [...new Set(parsed)];
  } catch {
    return fallback;
  }
}

export const loadParties = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const done = await sql<{ key: string }>`select key from app_flags where key = 'supplier-short-v1'`;
    if (!done.length) {
      await sql`update invoices set supplier = 'مانيرفا' where supplier like '%مانير%'`;
      await sql`update invoices set supplier = 'دوجلوس' where supplier like '%دوجلوس%'`;
      await sql.query("insert into app_flags (key, value) values ('supplier-short-v1', '1') on conflict (key) do nothing");
    }
    const meatSuppliers = await readPartyList("suppliers", ["مانيرفا", "دوجلوس"]);
    const fishSuppliers = await readPartyList("suppliers_fish", []);
    const meatProducts = await readPartyList("products_meat", ["أنجوس", "خاروف", "بريسكيت"]);
    const fishProducts = await readPartyList("products_fish", []);
    const importers = await readPartyList("importers", []);
    const brokers = await readPartyList("brokers", ["روي", "عادل", "طوني"]);
    const phoneRows = await sql<{ value: string }>`select value from app_flags where key = 'broker_phones'`;
    let brokerPhones: Record<string, string> = {};
    try {
      const parsed = JSON.parse(phoneRows[0]?.value ?? "{}") as Record<string, string>;
      if (parsed && typeof parsed === "object") brokerPhones = parsed;
    } catch {
      brokerPhones = {};
    }
    return { meatSuppliers, fishSuppliers, meatProducts, fishProducts, importers, brokers, brokerPhones };
  });

export const saveParties = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      meatSuppliers: partyList,
      fishSuppliers: partyList,
      meatProducts: partyList,
      fishProducts: partyList,
      importers: partyList,
      brokers: partyList,
      brokerPhones: z.record(z.string().max(80), z.string().max(20)),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
    const clean = (names: string[]) => [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    const saved = {
      meatSuppliers: clean(data.meatSuppliers),
      fishSuppliers: clean(data.fishSuppliers),
      meatProducts: clean(data.meatProducts),
      fishProducts: clean(data.fishProducts),
      importers: clean(data.importers),
      brokers: clean(data.brokers),
      brokerPhones: Object.fromEntries(
        Object.entries(data.brokerPhones)
          .map(([name, phone]) => [name.trim(), phone.replace(/[^\d+]/g, "")])
          .filter(([name, phone]) => name && phone),
      ),
    };
    const pairs: [string, string[]][] = [
      ["suppliers", saved.meatSuppliers],
      ["suppliers_fish", saved.fishSuppliers],
      ["products_meat", saved.meatProducts],
      ["products_fish", saved.fishProducts],
      ["importers", saved.importers],
      ["brokers", saved.brokers],
    ];
    for (const [key, names] of pairs) {
      await sql.query("insert into app_flags (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value", [
        key,
        JSON.stringify(names),
      ]);
    }
    await sql.query("insert into app_flags (key, value) values ('broker_phones', $1) on conflict (key) do update set value = excluded.value", [
      JSON.stringify(saved.brokerPhones),
    ]);
    return saved;
  });

export const moveInvoice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1).max(80), category: z.enum(ledgerSections) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    const rows = await sql<{ number: string; container_number: string }>`
      update invoices set category = ${data.category} where id = ${data.id} returning number, container_number
    `;
    const row = rows[0];
    if (!row) throw new Error("الفاتورة غير موجودة");
    if (row.container_number) {
      await sql`update containers set category = ${data.category} where number = ${row.container_number}`;
    }
    if (row.number) {
      await sql`update containers set category = ${data.category} where invoice_number = ${row.number}`;
    }
    await writeLog(context.username, "فاتورة", `نقل ${row.number} إلى ${data.category === "fish" ? "السمك" : "العجل والخاروف"}`);
    return { ok: true };
  });

export const resetLedger = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ password: z.string().max(40) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.password !== "123321") throw new Error("كلمة السر غير صحيحة");
    const sql = await getSql();
    await sql`delete from payments`;
    await sql`delete from invoices`;
    await sql`delete from containers`;
    await sql.query("create table if not exists invoice_files (id text primary key, invoice_id text not null, kind text not null, filename text not null default '', data text not null default '')");
    await sql`delete from invoice_files`;
    await writeLog(context.username, "دفتر", "تصفير كل البيانات");
    return { ok: true };
  });

export const importLedger = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(ledgerSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sql = await getSql();
    await sql`delete from payments`;
    await sql`delete from invoices`;
    await sql`delete from containers`;
    await sql.query("create table if not exists invoice_files (id text primary key, invoice_id text not null, kind text not null, filename text not null default '', data text not null default '')");
    await sql`delete from invoice_files`;
    for (const row of data.invoices) {
      await sql`
        insert into invoices (
          id, user_id, number, supplier, importer, product, quantity, amount, currency, status, note, container_number,
          agri_license, agri_available, beitel_license, beitel_available, category
        )
        values (
          ${row.id},
          ${context.userId},
          ${row.number},
          ${row.supplier},
          ${row.importer},
          ${row.product},
          ${row.quantity},
          ${row.amount},
          ${row.currency},
          ${row.status},
          ${row.note},
          ${row.containerNumber},
          ${row.agriLicense},
          ${row.agriAvailable},
          ${row.beitElLicense},
          ${row.beitElAvailable},
          ${row.category}
        )
      `;
    }
    for (const row of data.containers) {
      await sql`
        insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, broker, dhl_address, dhl_shipment, docs_requested, docs_arrived, telex_requested, telex_state, email_requested, customs_no, at_company)
        values (
          ${row.id},
          ${context.userId},
          ${row.number},
          ${row.type},
          ${row.port},
          ${row.status},
          ${etaValue(row.eta)},
          ${row.invoiceNumber},
          ${row.note},
          ${row.category},
          ${row.broker},
          ${row.dhlAddress},
          ${row.dhlShipment},
          ${row.docsRequested},
          ${row.docsArrived},
          ${row.telexRequested},
          ${row.telexState || ""},
          ${row.emailRequested},
          ${row.customsNo || ""},
          ${Boolean(row.atCompany)}
        )
      `;
    }
    const invoiceIds = new Set(data.invoices.map((row) => row.id));
    for (const row of data.payments) {
      if (!invoiceIds.has(row.invoiceId)) continue;
      await sql`
        insert into payments (id, user_id, invoice_id, amount, paid_on, note, receipt)
        values (${row.id}, ${context.userId}, ${row.invoiceId}, ${row.amount}, ${row.paidOn}, ${row.note}, ${row.receipt})
      `;
    }
    await writeLog(context.username, "دفتر", "استيراد نسخة");
    return { ok: true };
  });
