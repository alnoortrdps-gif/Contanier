import type { Sql } from "@/lib/db";

type Pay = { amount: number; date: string; note?: string };
type SheetRow = {
  invoice: string;
  supplier: string;
  note: string;
  amount: number;
  payments: Pay[];
  container: string;
  eta: string;
  beit: string;
  extra: string;
};

const rows: SheetRow[] = [
  {
    invoice: "87193",
    supplier: "مانيرفا / برازيل / ناتو",
    note: "رايد + دهن عجل",
    amount: 112285,
    payments: [
      { amount: 70000, date: "2026-01-08" },
      { amount: 27934, date: "2026-04-06" },
      { amount: 17666, date: "2026-04-13" },
    ],
    container: "MNBU9155774",
    eta: "2026-04-22",
    beit: "2704261143",
    extra: "المخلص: ROY / Eldan",
  },
  {
    invoice: "7737",
    supplier: "دوجلوس - ناتو",
    note: "لسان عجل + تندرلوين +كيبرول + توب سايد + ستربليون موجوده في البوندد نازله من كونتينر",
    amount: 205440,
    payments: [
      { amount: 65000, date: "2026-12-31" },
      { amount: 140500, date: "2026-03-10" },
    ],
    container: "OOLU6256358",
    eta: "2026-03-30",
    beit: "1504261060",
    extra: "",
  },
  {
    invoice: "89401-2",
    supplier: "مانيرفا - برازيلي - انجوس حاوية 2",
    note: "أنجوس منوع",
    amount: 314757.55,
    payments: [
      { amount: 60000, date: "2026-06-08" },
      { amount: 50000, date: "2026-06-14" },
      { amount: 45000, date: "2026-06-18" },
    ],
    container: "MNBU0530513",
    eta: "2026-10-31",
    beit: "",
    extra: "",
  },
  {
    invoice: "89977",
    supplier: "مانيرفا - دهن نور - أنجوس",
    note: "أنجوس - دهن + كيبرول - تندرلوين - توب سايد - ستربليون",
    amount: 351580,
    payments: [
      { amount: 63000, date: "2026-06-15" },
      { amount: 50000, date: "2026-06-17" },
      { amount: 50000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MSDU9702409",
    eta: "2026-10-31",
    beit: "9508261104",
    extra: "",
  },
  {
    invoice: "AR-19559",
    supplier: "مانيرفا ارجنتيني (كوتا من صالح)",
    note: "كيبرول (كوتا من صالح)",
    amount: 127460,
    payments: [
      { amount: 65000, date: "2026-07-20" },
      { amount: 62460, date: "2026-07-20", note: "تم دفعها ونور نسي يصور ورقة التحويل. التاريخ مو مذكور بالملف" },
    ],
    container: "MCAU6018450",
    eta: "2026-09-17",
    beit: "",
    extra: "المخلص: طوني + إيفون",
  },
  {
    invoice: "ALC263729",
    supplier: "لحم خاروف - استراليا",
    note: "لسان خاروف + أصناف أخرى - نور",
    amount: 226033.84,
    payments: [
      { amount: 120000, date: "2026-07-13" },
      { amount: 55000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
      { amount: 51034, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "OTPU6453279",
    eta: "2026-10-29",
    beit: "",
    extra: "المخلص: عادل · DHL: 4126194590",
  },
  {
    invoice: "90611",
    supplier: "لسان - بريسكيت - مانيرفا",
    note: "لسان عجل - بريسكيت",
    amount: 153690,
    payments: [
      { amount: 85000, date: "2026-07-14" },
      { amount: 68690, date: "2026-09-28" },
    ],
    container: "MNBU0674444",
    eta: "2026-10-08",
    beit: "",
    extra: "المخلص: ROY / Eldan",
  },
  {
    invoice: "AR/19878",
    supplier: "بلاك أرجنتيني مانيرفا",
    note: "بلاك أرجنتيني مانيرفا",
    amount: 296500,
    payments: [{ amount: 150000, date: "2026-07-23" }],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "91321",
    supplier: "أنجوس منوع",
    note: "أنجوس منوع",
    amount: 420000,
    payments: [{ amount: 130000, date: "2026-08-27" }],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "ALC264448",
    supplier: "لحم خاروف - استراليا",
    note: "لحم خاروف مقطع",
    amount: 126378.29,
    payments: [
      { amount: 63000, date: "2026-09-15" },
      { amount: 63378, date: "2026-09-30" },
    ],
    container: "MSDU3080545",
    eta: "2026-10-29",
    beit: "",
    extra: "المخلص: ROY/Eldan · DHL: 4126194590",
  },
  {
    invoice: "174926",
    supplier: "دوجلوس / ناتو",
    note: "أرقام",
    amount: 91007,
    payments: [
      { amount: 35000, date: "2026-08-11", note: "من حساب ناتو - دانه" },
      { amount: 56007, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "FBIU5940270",
    eta: "2026-10-24",
    beit: "",
    extra: "",
  },
  {
    invoice: "91357-1",
    supplier: "مانيرفا",
    note: "بريسكت",
    amount: 172500,
    payments: [{ amount: 52000, date: "2026-08-19" }],
    container: "TTNU8149787",
    eta: "2026-12-07",
    beit: "",
    extra: "",
  },
  {
    invoice: "91357-2",
    supplier: "مانيرفا",
    note: "بريسكت",
    amount: 172500,
    payments: [{ amount: 52000, date: "2026-08-19" }],
    container: "MNBU3273050",
    eta: "2026-11-12",
    beit: "",
    extra: "",
  },
  {
    invoice: "ALC264447",
    supplier: "مانيرفا استراليا",
    note: "لحم خاروف مقطع",
    amount: 128501,
    payments: [
      { amount: 63000, date: "2026-09-15" },
      { amount: 65501, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MSDU3006234",
    eta: "2026-10-30",
    beit: "",
    extra: "DHL: 3793563351",
  },
  {
    invoice: "180626",
    supplier: "دوجلوس / ناتو",
    note: "نمره + 4 دهن",
    amount: 178800,
    payments: [{ amount: 55000, date: "2026-09-01" }],
    container: "OERU4099396",
    eta: "2026-11-23",
    beit: "",
    extra: "",
  },
  {
    invoice: "180526",
    supplier: "دوجلوس / نور",
    note: "نمره + 4 دهن",
    amount: 178615.93,
    payments: [
      { amount: 55000, date: "2026-09-02" },
      { amount: 80925, date: "2026-09-30", note: "تحويل من الإسلامية من مبلغ فاتورتين" },
      { amount: 42691, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MMAU1478750",
    eta: "2026-10-26",
    beit: "",
    extra: "",
  },
  {
    invoice: "83776-1RS",
    supplier: "مانيرفا نور",
    note: "أنجوس منوع - كرتونة صينية",
    amount: 214750.82,
    payments: [
      { amount: 210000, date: "2026-09-17" },
      { amount: 4751, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MEDUR3535800",
    eta: "",
    beit: "",
    extra: "رقم الحاوية غير مأكد",
  },
  {
    invoice: "84583-8S",
    supplier: "مانيرفا نور",
    note: "أرقام صيني",
    amount: 142766.49,
    payments: [
      { amount: 140000, date: "2026-09-17" },
      { amount: 2766, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MEDUR3535834",
    eta: "",
    beit: "",
    extra: "رقم الحاوية غير مأكد",
  },
  {
    invoice: "83208-6S",
    supplier: "مانيرفا نور",
    note: "أرقام صيني",
    amount: 142907.46,
    payments: [
      { amount: 140000, date: "2026-09-17" },
      { amount: 2907, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "MEDUR3535768",
    eta: "",
    beit: "",
    extra: "رقم الحاوية غير مأكد",
  },
  {
    invoice: "185626",
    supplier: "دوجلوس - نور ميتاني",
    note: "مقدم + دهن",
    amount: 140200,
    payments: [{ amount: 42100, date: "2026-09-30" }],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "92015",
    supplier: "مانيرفا - نور",
    note: "أنجوس منوع وفيليه أنجوس وكيبرول",
    amount: 449200,
    payments: [],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "92017-1",
    supplier: "مانيرفا - نور",
    note: "أنجوس منوع وفيليه أنجوس وكيبرول",
    amount: 307525,
    payments: [],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "92017-2",
    supplier: "مانيرفا - نور",
    note: "أنجوس منوع وفيليه أنجوس وكيبرول",
    amount: 307525,
    payments: [{ amount: 93000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" }],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "189026",
    supplier: "لسان عجل - دوجلوس 15 طن - ناتو",
    note: "لسان عجل - دوجلوس 15 طن - ناتو",
    amount: 132300,
    payments: [],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
  {
    invoice: "188926",
    supplier: "دهن عجل دوجلوس - 28 طن - ناتو",
    note: "لسان عجل - دوجلوس 15 طن - ناتو",
    amount: 193050,
    payments: [],
    container: "",
    eta: "",
    beit: "",
    extra: "",
  },
];

function sheetId(invoice: string) {
  return `sheet-${invoice.replace(/[^A-Za-z0-9]+/g, "-")}`;
}

export async function ensureSheetSeed(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const flags = await sql<{ key: string }>`select key from app_flags where key = 'sheet-visible-dates'`;
  if (flags.length) return;

  let userId = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) userId = users[0].id;
  } catch {
    userId = "sheet";
  }

  await sql.query("begin");
  try {
    await sql.query("delete from payments where id like 'sheet-%' or invoice_id like 'sheet-%'");
    await sql.query("delete from invoices where id like 'sheet-%'");
    await sql.query("delete from containers where id like 'sheet-%'");
    const seenBoxes = new Set<string>();
    for (const row of rows) {
      const invoiceId = sheetId(row.invoice);
      const paid = row.payments.reduce((sum, item) => sum + item.amount, 0);
      const status = paid + 0.009 >= row.amount ? "paid" : "pending";
      const beit = row.beit.trim();
      await sql.query(
        `insert into invoices (
          id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
          agri_license, agri_available, beitel_license, beitel_available
        ) values ($1,$2,$3,$4,'—',$5,$6,'USD',$7,$8,$9,'',false,$10,$11)`,
        [invoiceId, userId, row.invoice, row.supplier, row.note, row.amount, status, row.note, row.container, beit, Boolean(beit)],
      );
      for (let index = 0; index < row.payments.length; index += 1) {
        const item = row.payments[index];
        await sql.query(
          `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)`,
          [`${invoiceId}-p${index + 1}`, userId, invoiceId, item.amount, item.date, item.note ?? ""],
        );
      }
      if (row.container && !seenBoxes.has(row.container)) {
        seenBoxes.add(row.container);
        const boxNote = row.extra;
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note)
           values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6)`,
          [sheetId(`box-${row.container}`), userId, row.container, row.eta || null, row.invoice, boxNote],
        );
      }
    }
    await sql.query("insert into app_flags (key, value) values ('sheet-visible-dates', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

const MAERSK = "https://www.maersk.com/tracking";
const MSC = "https://www.msc.com";
const OOCL = "https://www.oocl.com/eng/ourservices/eservices/cargotracking/pages/cargotracking.aspx";

const sheetMeta: Record<string, { track?: string; line?: string; invoiceNote?: string }> = {
  "87193": { track: MAERSK, line: "ميرسك" },
  "7737": { track: OOCL, line: "OOCL" },
  "89401-2": { track: MAERSK, line: "ميرسك" },
  "89977": { track: MSC, line: "MSC" },
  "AR-19559": { track: MAERSK, line: "ميرسك" },
  "ALC263729": { track: MSC, line: "MSC" },
  "AR/19878": { invoiceNote: "التحميل نهاية الأسبوع" },
  "91321": { invoiceNote: "التحميل نهاية الأسبوع" },
  "ALC264448": { track: MSC, line: "MSC" },
  "174926": { track: OOCL, line: "OOCL" },
  "91357-1": { track: MSC, line: "MSC" },
  "91357-2": { track: MAERSK, line: "ميرسك" },
  "ALC264447": { track: MSC, line: "MSC" },
  "180626": { track: OOCL, line: "OOCL" },
  "180526": { track: MAERSK, line: "ميرسك" },
  "83776-1RS": { track: MSC, line: "MSC" },
  "84583-8S": { track: MSC, line: "MSC" },
  "83208-6S": { track: MSC, line: "MSC" },
};

function sheetDay(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return iso;
  return `${day}-${month}-${year}`;
}

function mergeText(current: string, extra: string) {
  if (!extra) return current;
  if (current.includes(extra)) return current;
  return current ? `${current} · ${extra}` : extra;
}

export async function syncMeatSheet(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'meat-sheet-2026-10-14'`;
  if (done.length) return;

  let fallbackUser = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) fallbackUser = users[0].id;
  } catch {
    fallbackUser = "sheet";
  }

  const today = new Date().toISOString().slice(0, 10);
  await sql.query("begin");
  try {
    for (const row of rows) {
      if (row.invoice === "90611") continue;
      const meta = sheetMeta[row.invoice] ?? {};
      const found = await sql<{ id: string; user_id: string; product: string; note: string; container_number: string }>`
        select id, user_id, product, note, container_number from invoices where number = ${row.invoice} and category <> 'fish'
      `;
      const paid = row.payments.reduce((sum, item) => sum + item.amount, 0);
      const status = row.amount > 0 && row.amount - paid <= 5 ? "paid" : "pending";
      let invoiceId = found[0]?.id ?? "";
      const userId = found[0]?.user_id || fallbackUser;
      let note = found[0]?.note ?? "";
      if (meta.invoiceNote) note = !note || note === found[0]?.product ? meta.invoiceNote : mergeText(note, meta.invoiceNote);
      else if (!note || note === found[0]?.product) note = row.note;

      if (!invoiceId) {
        invoiceId = sheetId(row.invoice);
        await sql.query(
          `insert into invoices (
            id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
            agri_license, agri_available, beitel_license, beitel_available, category
          ) values ($1,$2,$3,$4,'—',$5,$6,'USD',$7,$8,$9,'',false,'',false,'meat')`,
          [invoiceId, userId, row.invoice, row.supplier, row.note, row.amount, status, note, row.container],
        );
      } else {
        await sql.query(
          `update invoices set supplier = $1, product = $2, amount = $3, status = $4, note = $5, container_number = $6 where id = $7`,
          [row.supplier, row.note, row.amount, status, note, row.container, invoiceId],
        );
      }

      const existingPays = await sql<{ id: string; amount: number; note: string }>`
        select id, amount, note from payments where invoice_id = ${invoiceId} order by paid_on asc, created_at asc
      `;
      for (let index = 0; index < row.payments.length; index += 1) {
        const item = row.payments[index];
        const current = existingPays[index];
        if (!current) {
          await sql.query(
            `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)`,
            [crypto.randomUUID(), userId, invoiceId, item.amount, item.date, item.note ?? ""],
          );
        } else if (Math.abs(Number(current.amount) - item.amount) > 0.009) {
          const nextNote = current.note || item.note || "";
          await sql.query(`update payments set amount = $1, note = $2 where id = $3`, [item.amount, nextNote, current.id]);
        }
      }
      const paidRows = await sql<{ paid: number }>`select coalesce(sum(amount), 0) as paid from payments where invoice_id = ${invoiceId}`;
      const paidNow = Number(paidRows[0]?.paid ?? 0);
      const nextStatus = row.amount > 0 && row.amount - paidNow <= 5 ? "paid" : "pending";
      if (nextStatus !== status) {
        await sql.query(`update invoices set status = $1 where id = $2`, [nextStatus, invoiceId]);
      }

      if (row.container) {
        const wanted = await sql<{ id: string; eta: string | null; note: string }>`
          select id, eta, note from containers where number = ${row.container} limit 1
        `;
        let box = wanted[0];
        const currentNumber = found[0]?.container_number ?? "";
        if (!box && currentNumber && currentNumber !== row.container) {
          const others = await sql<{ id: string }>`
            select id from invoices where container_number = ${currentNumber} and id <> ${invoiceId}
          `;
          const currentBox = await sql<{ id: string; eta: string | null; note: string }>`
            select id, eta, note from containers where number = ${currentNumber} limit 1
          `;
          if (currentBox[0] && others.length === 0) {
            await sql.query(`update containers set number = $1 where id = $2`, [row.container, currentBox[0].id]);
            box = currentBox[0];
          }
        }
        const oldEta = box?.eta ? String(box.eta).slice(0, 10) : "";
        const nextEta = row.eta || "";
        let etaNote = "";
        if (oldEta && nextEta && oldEta !== nextEta) etaNote = `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(nextEta)}`;
        else if (oldEta && !nextEta) etaNote = `انمسح موعد الوصول، كان ${sheetDay(oldEta)}`;
        const boxNote = mergeText(box?.note ?? "", row.extra);
        if (!box) {
          await sql.query(
            `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, line_name, track_url)
             values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6,'meat',$7,$8)`,
            [crypto.randomUUID(), userId, row.container, nextEta || null, row.invoice, boxNote, meta.line ?? "", meta.track ?? ""],
          );
        } else {
          await sql.query(
            `update containers set
              eta = $1,
              invoice_number = $2,
              note = $3,
              category = 'meat',
              line_name = case when $4 <> '' then $4 else line_name end,
              track_url = case when $5 <> '' then $5 else track_url end,
              eta_note = case when $6 <> '' then $6 else eta_note end,
              eta_snapshot = case when $6 <> '' then $7 else eta_snapshot end,
              eta_checked = case when $6 <> '' then $8 else eta_checked end
            where id = $9`,
            [nextEta || null, row.invoice, boxNote, meta.line ?? "", meta.track ?? "", etaNote, nextEta, today, box.id],
          );
        }
      }
    }
    await sql.query("insert into app_flags (key, value) values ('meat-sheet-2026-10-14', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncMeatVerify(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'meat-sheet-verify-2'`;
  if (done.length) return;
  const fixes: { invoice: string; supplier?: string; product?: string; amount?: number; note?: string }[] = [
    { invoice: "87193", supplier: "مانيرفا - برازيل/ ناتو", product: "رايد + دهن عجل", amount: 112285 },
    { invoice: "7737", product: "لسان عجل + تندرلوين + كيرول + توب سايد + ستربليون موجوده في البوندد نازله من كونتينر" },
    { invoice: "89977", product: "أنجوس - دهن + كيرول - تندرلوين - توب سايد - ستربليون" },
    { invoice: "AR-19559", product: "كيرول (كوتا من صالح)" },
    { invoice: "AR/19878", note: "التحميل نهاية الأسبوع" },
    { invoice: "91321", note: "التحميل نهاية الأسبوع" },
  ];
  await sql.query("begin");
  try {
    for (const row of fixes) {
      if (row.supplier) await sql.query(`update invoices set supplier = $1 where number = $2 and category <> 'fish'`, [row.supplier, row.invoice]);
      if (row.product) await sql.query(`update invoices set product = $1 where number = $2 and category <> 'fish'`, [row.product, row.invoice]);
      if (row.amount) await sql.query(`update invoices set amount = $1 where number = $2 and category <> 'fish'`, [row.amount, row.invoice]);
      if (row.note) {
        await sql.query(
          `update invoices set note = case when note like '%' || $1 || '%' then note else $1 end where number = $2 and category <> 'fish'`,
          [row.note, row.invoice],
        );
      }
    }
    await sql.query(
      `update containers set note = case when note like '%رقم الحاوية غير مأكد%' then note else trim(note || ' رقم الحاوية غير مأكد') end
       where number in ('241ISZ2634147', 'MEDUR3535800', 'MEDUR3535834', 'MEDUR3535768')`,
    );
    await sql.query("insert into app_flags (key, value) values ('meat-sheet-verify-2', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncMeatOct17(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'meat-sheet-2026-10-17b'`;
  if (done.length) return;
  let userId = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) userId = users[0].id;
  } catch {
    userId = "sheet";
  }
  const today = new Date().toISOString().slice(0, 10);
  const etaFixes = [
    { number: "OTPU6453279", eta: "2026-10-29" },
    { number: "MSDU3080545", eta: "2026-10-29" },
    { number: "FBIU5940270", eta: "2026-10-24" },
    { number: "MNBU3273050", eta: "2026-11-12" },
  ];
  const products = [
    { invoice: "87193", supplier: "مانيرفا / برازيل / ناتو", product: "رايد + دهن عجل" },
    { invoice: "7737", product: "لسان عجل + تندرلوين +كيبرول + توب سايد + ستربليون موجوده في البوندد نازله من كونتينر" },
    { invoice: "89977", product: "أنجوس - دهن + كيبرول - تندرلوين - توب سايد - ستربليون" },
    { invoice: "AR-19559", product: "كيبرول (كوتا من صالح)" },
    { invoice: "92015", product: "أنجوس منوع وفيليه أنجوس وكيبرول" },
    { invoice: "92017-1", product: "أنجوس منوع وفيليه أنجوس وكيبرول" },
    { invoice: "92017-2", product: "أنجوس منوع وفيليه أنجوس وكيبرول" },
    { invoice: "91357-1", product: "بريسكت" },
    { invoice: "91357-2", product: "بريسكت" },
  ];
  const fresh = [
    { invoice: "189026", supplier: "لسان عجل - دوجلوس 15 طن - ناتو", product: "لسان عجل - دوجلوس 15 طن - ناتو", amount: 132300 },
    { invoice: "188926", supplier: "دهن عجل دوجلوس - 28 طن - ناتو", product: "لسان عجل - دوجلوس 15 طن - ناتو", amount: 193050 },
  ];
  await sql.query("begin");
  try {
    for (const row of etaFixes) {
      const boxes = await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${row.number} limit 1`;
      const oldEta = boxes[0]?.eta ? String(boxes[0].eta).slice(0, 10) : "";
      if (!boxes[0] || oldEta === row.eta) continue;
      const etaNote = oldEta ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}` : `تغير موعد الوصول، صار ${sheetDay(row.eta)}`;
      await sql.query(`update containers set eta = $1, eta_note = $2, eta_snapshot = $3, eta_checked = $4 where id = $5`, [
        row.eta,
        etaNote,
        row.eta,
        today,
        boxes[0].id,
      ]);
    }
    await sql.query(`update invoices set container_number = 'TTNU8149787' where number = '91357-1' and category <> 'fish'`);
    const oldBox = await sql<{ id: string; eta: string | null; note: string }>`select id, eta, note from containers where number = '241ISZ2634147' limit 1`;
    const newBox = await sql<{ id: string }>`select id from containers where number = 'TTNU8149787' limit 1`;
    if (oldBox[0] && !newBox[0]) {
      const cleaned = oldBox[0].note.replaceAll("رقم الحاوية غير مأكد", "").replace(/\s*·\s*·\s*/g, " · ").trim();
      await sql.query(
        `update containers set number = 'TTNU8149787', eta = '2026-12-07', invoice_number = '91357-1', note = $1,
          line_name = 'MSC', track_url = $2, eta_note = $3, eta_snapshot = '2026-12-07', eta_checked = $4 where id = $5`,
        [cleaned, MSC, "تغير موعد الوصول، صار 07-12-2026، ورقم الحاوية صار TTNU8149787", today, oldBox[0].id],
      );
    } else if (!newBox[0] && !oldBox[0]) {
      await sql.query(
        `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, line_name, track_url, eta_note, eta_snapshot, eta_checked)
         values ($1,$2,'TTNU8149787','40 قدم','','transit','2026-12-07','91357-1','','meat','MSC',$3,$4,'2026-12-07',$5)`,
        [crypto.randomUUID(), userId, MSC, "تغير موعد الوصول، صار 07-12-2026", today],
      );
    }
    for (const row of products) {
      if (row.supplier) {
        await sql.query(`update invoices set supplier = $1, product = $2 where number = $3 and category <> 'fish'`, [row.supplier, row.product, row.invoice]);
      } else {
        await sql.query(`update invoices set product = $1 where number = $2 and category <> 'fish'`, [row.product, row.invoice]);
      }
    }
    for (const row of fresh) {
      const found = await sql<{ id: string }>`select id from invoices where number = ${row.invoice} and category <> 'fish'`;
      if (found.length) continue;
      await sql.query(
        `insert into invoices (
          id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
          agri_license, agri_available, beitel_license, beitel_available, category
        ) values ($1,$2,$3,$4,'—',$5,$6,'USD','pending',$5,'','',false,'',false,'meat')`,
        [crypto.randomUUID(), userId, row.invoice, row.supplier, row.product, row.amount],
      );
    }
    await sql.query("insert into app_flags (key, value) values ('meat-sheet-2026-10-17b', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncMeatArrivalOct19(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'meat-arrival-2026-10-19'`;
  if (done.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const fixes = [
    { invoice: "ALC263729", eta: "2026-11-16" },
    { invoice: "ALC264448", eta: "2026-11-16" },
    { invoice: "91357-1", eta: "2026-12-13" },
    { invoice: "83776-1RS", eta: "2026-12-02" },
    { invoice: "84583-8S", eta: "2026-12-02" },
    { invoice: "83208-6S", eta: "2026-12-02" },
  ];
  await sql.query("begin");
  try {
    for (const row of fixes) {
      const invoices = await sql<{ container_number: string }>`
        select container_number from invoices where number = ${row.invoice} and category <> 'fish' limit 1
      `;
      const linked = invoices[0]?.container_number ?? "";
      const boxes = linked
        ? await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${linked} limit 1`
        : await sql<{ id: string; eta: string | null }>`select id, eta from containers where invoice_number = ${row.invoice} limit 1`;
      if (!boxes[0]) continue;
      const oldEta = boxes[0].eta ? String(boxes[0].eta).slice(0, 10) : "";
      if (oldEta === row.eta) continue;
      const etaNote = oldEta
        ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}`
        : `تغير موعد الوصول، صار ${sheetDay(row.eta)}`;
      await sql.query(
        `update containers set eta = $1, eta_note = $2, eta_snapshot = $3, eta_checked = $4 where id = $5`,
        [row.eta, etaNote, row.eta, today, boxes[0].id],
      );
    }
    await sql.query("insert into app_flags (key, value) values ('meat-arrival-2026-10-19', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncMeatArrivalOct20(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'meat-arrival-2026-10-20'`;
  if (done.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const fixes = [
    { invoice: "91357-2", eta: "2026-12-12" },
    { invoice: "180526", eta: "2026-10-27" },
    { invoice: "83776-1RS", eta: "2026-12-03" },
    { invoice: "84583-8S", eta: "2026-12-03" },
    { invoice: "83208-6S", eta: "2026-12-03" },
  ];
  await sql.query("begin");
  try {
    for (const row of fixes) {
      const invoices = await sql<{ container_number: string }>`
        select container_number from invoices where number = ${row.invoice} and category <> 'fish' limit 1
      `;
      const linked = invoices[0]?.container_number ?? "";
      const boxes = linked
        ? await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${linked} limit 1`
        : await sql<{ id: string; eta: string | null }>`select id, eta from containers where invoice_number = ${row.invoice} limit 1`;
      if (!boxes[0]) continue;
      const oldEta = boxes[0].eta ? String(boxes[0].eta).slice(0, 10) : "";
      if (oldEta === row.eta) continue;
      const etaNote = oldEta
        ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}`
        : `تغير موعد الوصول، صار ${sheetDay(row.eta)}`;
      await sql.query(
        `update containers set eta = $1, eta_note = $2, eta_snapshot = $3, eta_checked = $4 where id = $5`,
        [row.eta, etaNote, row.eta, today, boxes[0].id],
      );
    }
    await sql.query("insert into app_flags (key, value) values ('meat-arrival-2026-10-20', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncSheetOct21(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'sheet-2026-10-21'`;
  if (done.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const dates: { invoice: string; eta: string; fish: boolean }[] = [
    { invoice: "174926", eta: "2026-10-28", fish: false },
    { invoice: "91357-1", eta: "2026-12-03", fish: false },
    { invoice: "ALC264447", eta: "2026-11-03", fish: false },
    { invoice: "180626", eta: "2026-11-30", fish: false },
    { invoice: "180526", eta: "2026-10-28", fish: false },
    { invoice: "FTF0605-NAF02-26", eta: "2026-11-04", fish: true },
    { invoice: "PROFORMA 60851", eta: "2026-11-30", fish: true },
    { invoice: "026/101", eta: "2026-12-10", fish: true },
  ];
  const gaps: { invoice: string; fish: boolean; target: number }[] = [
    { invoice: "89401-2", fish: false, target: 215000 },
    { invoice: "189026", fish: false, target: 40000 },
  ];
  await sql.query("begin");
  try {
    for (const row of dates) {
      const invoices = await sql<{ id: string; user_id: string; container_number: string }>`
        select id, user_id, container_number from invoices
        where number = ${row.invoice} and category = ${row.fish ? "fish" : "meat"}
        limit 1
      `;
      const invoice = invoices[0];
      if (!invoice) continue;
      const linked = invoice.container_number ?? "";
      const boxes = linked
        ? await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${linked} limit 1`
        : await sql<{ id: string; eta: string | null }>`select id, eta from containers where invoice_number = ${row.invoice} limit 1`;
      const oldEta = boxes[0]?.eta ? String(boxes[0].eta).slice(0, 10) : "";
      if (oldEta === row.eta) continue;
      const etaNote = oldEta
        ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}`
        : `تغير موعد الوصول، صار ${sheetDay(row.eta)}`;
      if (boxes[0]) {
        await sql.query(
          `update containers set eta = $1, eta_note = $2, eta_snapshot = $3, eta_checked = $4 where id = $5`,
          [row.eta, etaNote, row.eta, today, boxes[0].id],
        );
      } else {
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, eta_note, eta_snapshot, eta_checked)
           values ($1,$2,'','40 قدم','','transit',$3,$4,$5,$6,$5,$3,$7)`,
          [crypto.randomUUID(), invoice.user_id, row.eta, row.invoice, etaNote, row.fish ? "fish" : "meat", today],
        );
      }
    }
    await sql.query(
      `update invoices set note = replace(note, 'التحميل نهاية الأسبوع', 'التحميل في 22 الشهر')
       where number in ('AR/19878', '91321') and category <> 'fish' and note like '%التحميل نهاية الأسبوع%'`,
    );
    await sql.query(
      `update invoices set note = trim(note || ' · التحميل في 22 الشهر')
       where number in ('AR/19878', '91321') and category <> 'fish' and note not like '%22 الشهر%'`,
    );
    await sql.query(
      `update invoices set note = trim(case when note = '' then 'التحميل بداية شهر 11' else note || ' · التحميل بداية شهر 11' end)
       where number = 'PI NAF03' and category = 'fish' and note not like '%بداية شهر 11%'`,
    );
    for (const row of gaps) {
      const invoices = await sql<{ id: string; user_id: string }>`
        select id, user_id from invoices where number = ${row.invoice} and category = ${row.fish ? "fish" : "meat"} limit 1
      `;
      const invoice = invoices[0];
      if (!invoice) continue;
      const paidRows = await sql<{ total: string | number }>`select coalesce(sum(amount), 0) as total from payments where invoice_id = ${invoice.id}`;
      const paid = Number(paidRows[0]?.total ?? 0);
      const missing = Math.round((row.target - paid) * 100) / 100;
      if (missing < 1) continue;
      await sql.query(
        `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)`,
        [crypto.randomUUID(), invoice.user_id, invoice.id, missing, "2026-10-21", "من الجدول، التاريخ غير مذكور"],
      );
    }
    await sql.query("insert into app_flags (key, value) values ('sheet-2026-10-21', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncSheetOct22(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'sheet-2026-10-22'`;
  if (done.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const fixes: { invoice: string; fish: boolean; eta?: string; container?: string; line?: string; track?: string }[] = [
    { invoice: "ALC264447", fish: false, eta: "2026-11-05" },
    { invoice: "180626", fish: false, eta: "2026-11-23" },
    { invoice: "91357-1", fish: false, container: "241ISZ2634147", eta: "2026-12-03" },
    { invoice: "7", fish: true, container: "SUDU6171226", eta: "2026-10-31", line: "ميرسك", track: MAERSK },
    { invoice: "8", fish: true, container: "MNBU9146710", eta: "2026-10-31", line: "ميرسك", track: MAERSK },
    { invoice: "13", fish: true, container: "SUDU6103772", eta: "2026-10-31", line: "ميرسك", track: MAERSK },
    { invoice: "14", fish: true, container: "MNBU9014288", eta: "2026-10-31", line: "ميرسك", track: MAERSK },
    { invoice: "PROFORMA 60851", fish: true, container: "OERU4436178", eta: "2026-11-23", line: "OOCL", track: OOCL },
    { invoice: "026/101", fish: true, container: "SUDU6178365", eta: "2026-12-10", line: "ميرسك", track: MAERSK },
    { invoice: "9108", fish: true, container: "MNBU3358587", line: "ميرسك", track: MAERSK },
  ];
  await sql.query("begin");
  try {
    for (const row of fixes) {
      const invoices = await sql<{ id: string; user_id: string; container_number: string }>`
        select id, user_id, container_number from invoices
        where number = ${row.invoice} and category = ${row.fish ? "fish" : "meat"}
        limit 1
      `;
      const invoice = invoices[0];
      if (!invoice) continue;
      const linked = invoice.container_number ?? "";
      const named = row.container
        ? await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${row.container} limit 1`
        : [];
      const current = named[0]
        ? named
        : linked
          ? await sql<{ id: string; eta: string | null }>`select id, eta from containers where number = ${linked} limit 1`
          : await sql<{ id: string; eta: string | null }>`select id, eta from containers where invoice_number = ${row.invoice} and number = '' limit 1`;
      const box = current[0];
      if (row.container) {
        await sql.query(`update invoices set container_number = $1 where id = $2`, [row.container, invoice.id]);
      }
      const oldEta = box?.eta ? String(box.eta).slice(0, 10) : "";
      const nextEta = row.eta && oldEta !== row.eta ? row.eta : "";
      const etaNote = nextEta
        ? oldEta
          ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(nextEta)}`
          : `تغير موعد الوصول، صار ${sheetDay(nextEta)}`
        : "";
      if (box) {
        await sql.query(
          `update containers set
             number = case when $1 <> '' then $1 else number end,
             invoice_number = $2,
             eta = case when $3 <> '' then $3 else eta end,
             eta_note = case when $4 <> '' then $4 else eta_note end,
             eta_snapshot = case when $3 <> '' then $3 else eta_snapshot end,
             eta_checked = case when $3 <> '' then $5 else eta_checked end,
             line_name = case when $6 <> '' then $6 else line_name end,
             track_url = case when $7 <> '' then $7 else track_url end
           where id = $8`,
          [row.container ?? "", row.invoice, nextEta, etaNote, today, row.line ?? "", row.track ?? "", box.id],
        );
      } else if (row.container || row.eta) {
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, line_name, track_url, eta_note, eta_snapshot, eta_checked)
           values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6,$7,$8,$9,$6,$4,$10)`,
          [
            crypto.randomUUID(),
            invoice.user_id,
            row.container ?? "",
            row.eta || null,
            row.invoice,
            etaNote,
            row.fish ? "fish" : "meat",
            row.line ?? "",
            row.track ?? "",
            today,
          ],
        );
      }
    }
    await sql.query("insert into app_flags (key, value) values ('sheet-2026-10-22', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncSheetOct24(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'sheet-2026-10-24b'`;
  if (done.length) return;
  const today = new Date().toISOString().slice(0, 10);
  const dates: { invoice: string; eta: string }[] = [
    { invoice: "89977", eta: "2026-11-04" },
    { invoice: "ALC263729", eta: "2026-11-14" },
    { invoice: "ALC264448", eta: "2026-11-14" },
    { invoice: "91357-1", eta: "2026-12-14" },
    { invoice: "ALC264447", eta: "2026-10-28" },
    { invoice: "180526", eta: "2026-10-27" },
    { invoice: "83776-1RS", eta: "2026-12-06" },
    { invoice: "84583-8S", eta: "2026-12-06" },
    { invoice: "83208-6S", eta: "2026-12-06" },
  ];
  const boxes = await sql<{ id: string; number: string; invoice_number: string; eta: string | null }>`
    select id, number, invoice_number, eta from containers
  `;
  const same = (left: string, right: string) => left.trim().toUpperCase() === right.trim().toUpperCase();
  let missed = false;
  for (const row of dates) {
    const invoices = await sql<{ id: string; user_id: string; container_number: string }>`
      select id, user_id, container_number from invoices
      where replace(replace(replace(trim(number), '–', '-'), ' ', ''), chr(160), '') = ${row.invoice}
        and coalesce(category, 'meat') <> 'fish'
    `;
    if (!invoices.length) {
      missed = true;
      continue;
    }
    for (const invoice of invoices) {
      const linked = (invoice.container_number ?? "").trim();
      const byNumber = linked ? boxes.filter((box) => same(box.number ?? "", linked)) : [];
      const byInvoice = boxes.filter((box) => same(box.invoice_number ?? "", row.invoice));
      const targets = byNumber.length ? byNumber : byInvoice;
      const noteFor = (oldEta: string) =>
        oldEta ? `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}` : `تغير موعد الوصول، صار ${sheetDay(row.eta)}`;
      if (!targets.length) {
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, eta_note, eta_snapshot, eta_checked)
           values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6,'meat',$6,$4,$7)`,
          [crypto.randomUUID(), invoice.user_id || "sheet", linked, row.eta, row.invoice, noteFor(""), today],
        );
        continue;
      }
      for (const box of targets) {
        const oldEta = box.eta ? String(box.eta).slice(0, 10) : "";
        if (oldEta === row.eta) continue;
        await sql.query(
          `update containers set eta = $1, eta_note = $2, eta_snapshot = $1, eta_checked = $3 where id = $4`,
          [row.eta, noteFor(oldEta), today, box.id],
        );
        box.eta = row.eta;
      }
    }
  }
  if (!missed) {
    await sql.query("insert into app_flags (key, value) values ('sheet-2026-10-24b', '1') on conflict (key) do nothing");
  }
}

export async function syncSheetPayOct22(sql: Sql) {
  const invoices = await sql<{ id: string; user_id: string }>`
    select id, user_id from invoices where number = '89401-2' and coalesce(category, 'meat') <> 'fish'
  `;
  for (const invoice of invoices) {
    const paidRows = await sql<{ total: string | number }>`select coalesce(sum(amount), 0) as total from payments where invoice_id = ${invoice.id}`;
    const paid = Number(paidRows[0]?.total ?? 0);
    const missing = Math.round((314758 - paid) * 100) / 100;
    if (missing >= 1 && missing <= 100000) {
      await sql.query(
        `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)`,
        [crypto.randomUUID(), invoice.user_id || "sheet", invoice.id, missing, "2026-10-22", "الدفعة 5 من الجدول"],
      );
      await sql.query(`update invoices set status = 'paid' where id = $1`, [invoice.id]);
    }
  }
  await sql.query(
    `update payments set amount = 80925
     where amount = 80924.97
       and invoice_id in (select id from invoices where number = '180526' and coalesce(category, 'meat') <> 'fish')`,
  );
}

export async function releaseArchiveWithoutCustoms(sql: Sql) {
  await sql.query(
    "update containers set at_company = false where at_company = true and length(trim(coalesce(customs_no, ''))) = 0",
  );
}

export async function archiveArrived90611(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'archive-90611'`;
  if (done.length) return;
  let userId = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) userId = users[0].id;
  } catch {
    userId = "sheet";
  }
  await sql.query("begin");
  try {
    const boxes = await sql<{ id: string }>`select id from containers where number = 'MNBU0674444' limit 1`;
    if (boxes[0]) {
      await sql.query(`update containers set at_company = true, status = 'delivered', invoice_number = '90611' where id = $1`, [boxes[0].id]);
    } else {
      await sql.query(
        `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, line_name, track_url, at_company)
         values ($1,$2,'MNBU0674444','40 قدم','','delivered','2026-10-08','90611','المخلص: ROY / Eldan','meat','ميرسك',$3,true)`,
        [crypto.randomUUID(), userId, MAERSK],
      );
    }
    await sql.query(`update invoices set container_number = 'MNBU0674444' where number = '90611' and category <> 'fish'`);
    await sql.query("insert into app_flags (key, value) values ('archive-90611', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}
type FishPay = { amount: number; date: string; note?: string };
type FishRow = {
  invoice: string;
  supplier: string;
  product: string;
  amount: number;
  currency?: string;
  payments: FishPay[];
  container: string;
  eta: string;
  track: string;
  previous?: string;
  invoiceNote?: string;
};

const fishRows: FishRow[] = [
  {
    invoice: "FTF0605-NAF02-26",
    supplier: "سمك فيليه رقم 3",
    product: "سمك فيليه حاوية 3",
    amount: 49200,
    payments: [{ amount: 25000, date: "2026-10-03", note: "التاريخ غير موجود بالملف" }],
    container: "EMCU5694025",
    eta: "2026-11-12",
    track: "https://www.shipmentlink.com/",
  },
  {
    invoice: "60643",
    supplier: "سمك سلمينو",
    product: "سمك سلمينو",
    amount: 75600,
    payments: [
      { amount: 25200, date: "2026-10-03", note: "التاريخ غير موجود بالملف" },
      { amount: 50435, date: "2026-10-03", note: "الدفعة 3 — التاريخ غير موجود بالملف" },
    ],
    container: "HLBU9388709",
    eta: "2026-10-04",
    track: "https://www.hapag-lloyd.com",
  },
  {
    invoice: "026/096",
    supplier: "سمك أرجنتيني حاوية 6",
    product: "سمك أرجنتيني 026/096",
    amount: 69720,
    payments: [{ amount: 35000, date: "2026-09-03" }],
    container: "MNBU9064231",
    eta: "2026-11-15",
    track: "https://www.maersk.com/tracking",
  },
  {
    invoice: "PI NAF03",
    previous: "FTF0856-NAF03-26",
    supplier: "سمك فيليه 4",
    product: "ستيك سمك + سمك فيليه مطلوب رخصة ستيك + فيليه",
    amount: 48560,
    payments: [{ amount: 30000, date: "2026-08-24" }],
    container: "",
    eta: "",
    track: "",
  },
  {
    invoice: "7",
    supplier: "سمك إسباني 1- نور + علاء عفانه",
    product: "حاوية 1",
    amount: 250000,
    currency: "EUR",
    payments: [
      { amount: 70000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
      { amount: 50000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" },
    ],
    container: "",
    eta: "2026-10-31",
    track: "",
    invoiceNote: "المبلغ يشمل فواتير 7 و 8 و 13 و 14",
  },
  {
    invoice: "8",
    supplier: "سمك إسباني 2+ علاء عفانه",
    product: "حاوية 2",
    amount: 0,
    currency: "EUR",
    payments: [],
    container: "",
    eta: "2026-10-31",
    track: "",
    invoiceNote: "المبلغ والدفعات على فاتورة 7",
  },
  {
    invoice: "13",
    supplier: "سمك إسباني 3+ علاء عفانه",
    product: "حاوية 3",
    amount: 0,
    currency: "EUR",
    payments: [],
    container: "",
    eta: "2026-10-31",
    track: "",
    invoiceNote: "المبلغ والدفعات على فاتورة 7",
  },
  {
    invoice: "14",
    supplier: "سمك إسباني 4+ علاء عفانه",
    product: "حاوية 4",
    amount: 0,
    currency: "EUR",
    payments: [],
    container: "",
    eta: "2026-10-31",
    track: "",
    invoiceNote: "المبلغ والدفعات على فاتورة 7",
  },
  {
    invoice: "PROFORMA 60851",
    supplier: "سمك سلمينو حاوية ثانية",
    product: "سمك سلمينو حاوية ثانية",
    amount: 76950,
    payments: [{ amount: 25000, date: "2026-09-28" }],
    container: "",
    eta: "2026-11-23",
    track: "",
  },
  {
    invoice: "026/105",
    supplier: "سمك أرجنتيني حاوية 7",
    product: "سمك أرجنتيني 026/105",
    amount: 71400,
    payments: [{ amount: 35000, date: "2026-09-28" }],
    container: "",
    eta: "",
    track: "",
  },
  {
    invoice: "026/101",
    supplier: "سمك أرجنتيني حاوية 8",
    product: "سمك أرجنتيني 026/101",
    amount: 68850,
    payments: [{ amount: 30000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" }],
    container: "",
    eta: "",
    track: "",
  },
  {
    invoice: "9108",
    supplier: "سمك مسكوزا",
    product: "سمك مسكوزا",
    amount: 76680,
    payments: [{ amount: 40000, date: "2026-10-14", note: "من الجدول، التاريخ غير مذكور" }],
    container: "",
    eta: "",
    track: "",
  },
];

function fishId(invoice: string) {
  return `fish-${invoice.replace(/[^A-Za-z0-9]+/g, "-")}`;
}

export async function ensureFishSeed(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const flags = await sql<{ key: string }>`select key from app_flags where key = 'fish-visible-v2'`;
  if (flags.length) return;

  let userId = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) userId = users[0].id;
  } catch {
    userId = "sheet";
  }

  const suppliers = [...new Set(fishRows.map((row) => row.supplier))];
  const products = [...new Set(fishRows.map((row) => row.product))];
  await sql.query("begin");
  try {
    for (const row of fishRows) {
      const invoiceId = fishId(row.invoice);
      const paid = row.payments.reduce((sum, item) => sum + item.amount, 0);
      const status = row.amount > 0 && paid + 0.009 >= row.amount ? "paid" : "pending";
      await sql.query(
        `insert into invoices (
          id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
          agri_license, agri_available, beitel_license, beitel_available, category
        ) values ($1,$2,$3,$4,'—',$5,$6,$7,$8,$9,$10,'',false,'',false,'fish')
        on conflict (id) do nothing`,
        [invoiceId, userId, row.invoice, row.supplier, row.product, row.amount, row.currency ?? "USD", status, row.invoiceNote || row.product, row.container],
      );
      for (let index = 0; index < row.payments.length; index += 1) {
        const item = row.payments[index];
        await sql.query(
          `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)
           on conflict (id) do nothing`,
          [`${invoiceId}-p${index + 1}`, userId, invoiceId, item.amount, item.date, item.note ?? ""],
        );
      }
      if (row.container) {
        const note = row.track ? `تتبع: ${row.track}` : "";
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category)
           values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6,'fish')
           on conflict (id) do nothing`,
          [fishId(`box-${row.container}`), userId, row.container, row.eta || null, row.invoice, note],
        );
      } else if (row.eta) {
        await sql.query(
          `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category)
           values ($1,$2,'','40 قدم','','transit',$3,$4,$5,'fish')
           on conflict (id) do nothing`,
          [fishId(`eta-${row.invoice}`), userId, row.eta, row.invoice, row.invoiceNote ?? ""],
        );
      }
    }
    await sql.query(
      "insert into app_flags (key, value) values ('suppliers_fish', $1) on conflict (key) do update set value = excluded.value",
      [JSON.stringify(suppliers)],
    );
    await sql.query(
      "insert into app_flags (key, value) values ('products_fish', $1) on conflict (key) do update set value = excluded.value",
      [JSON.stringify(products)],
    );
    await sql.query("insert into app_flags (key, value) values ('fish-visible-v2', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

export async function syncFishSheet(sql: Sql) {
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  const done = await sql<{ key: string }>`select key from app_flags where key = 'fish-sheet-2026-10-14'`;
  if (done.length) return;

  let fallbackUser = "sheet";
  try {
    const users = await sql<{ id: string }>`select id from "user" limit 1`;
    if (users[0]?.id) fallbackUser = users[0].id;
  } catch {
    fallbackUser = "sheet";
  }
  const today = new Date().toISOString().slice(0, 10);

  await sql.query("begin");
  try {
    for (const row of fishRows) {
      let found = await sql<{ id: string; user_id: string; product: string; note: string; container_number: string }>`
        select id, user_id, product, note, container_number from invoices where number = ${row.invoice} and category = 'fish'
      `;
      if (!found.length && row.previous) {
        found = await sql<{ id: string; user_id: string; product: string; note: string; container_number: string }>`
          select id, user_id, product, note, container_number from invoices where number = ${row.previous} and category = 'fish'
        `;
      }
      const userId = found[0]?.user_id || fallbackUser;
      const paid = row.payments.reduce((sum, item) => sum + item.amount, 0);
      const status = row.amount > 0 && row.amount - paid <= 5 ? "paid" : "pending";
      const currency = row.currency ?? "USD";
      let note = found[0]?.note ?? "";
      if (row.invoiceNote) note = !note || note === found[0]?.product ? row.invoiceNote : mergeText(note, row.invoiceNote);
      else if (!note || note === found[0]?.product) note = row.product;
      let invoiceId = found[0]?.id ?? "";
      if (!invoiceId) {
        invoiceId = fishId(row.invoice);
        await sql.query(
          `insert into invoices (
            id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
            agri_license, agri_available, beitel_license, beitel_available, category
          ) values ($1,$2,$3,$4,'—',$5,$6,$7,$8,$9,$10,'',false,'',false,'fish')`,
          [invoiceId, userId, row.invoice, row.supplier, row.product, row.amount, currency, status, note, row.container],
        );
      } else {
        await sql.query(
          `update invoices set number = $1, supplier = $2, product = $3, amount = $4, currency = $5, status = $6, note = $7,
            container_number = case when $8 <> '' then $8 else container_number end
           where id = $9`,
          [row.invoice, row.supplier, row.product, row.amount, currency, status, note, row.container, invoiceId],
        );
      }

      const existingPays = await sql<{ id: string; amount: number; note: string }>`
        select id, amount, note from payments where invoice_id = ${invoiceId} order by paid_on asc, created_at asc
      `;
      for (let index = 0; index < row.payments.length; index += 1) {
        const item = row.payments[index];
        const current = existingPays[index];
        if (!current) {
          await sql.query(
            `insert into payments (id, user_id, invoice_id, amount, paid_on, note) values ($1,$2,$3,$4,$5,$6)`,
            [crypto.randomUUID(), userId, invoiceId, item.amount, item.date, item.note ?? ""],
          );
        } else if (Math.abs(Number(current.amount) - item.amount) > 0.009) {
          await sql.query(`update payments set amount = $1, note = case when note = '' then $2 else note end where id = $3`, [
            item.amount,
            item.note ?? "",
            current.id,
          ]);
        }
      }

      if (row.container || row.eta) {
        const linked = row.container
          ? await sql<{ id: string; eta: string | null; note: string }>`select id, eta, note from containers where number = ${row.container} limit 1`
          : await sql<{ id: string; eta: string | null; note: string }>`select id, eta, note from containers where invoice_number = ${row.invoice} limit 1`;
        const oldEta = linked[0]?.eta ? String(linked[0].eta).slice(0, 10) : "";
        const nextEta = row.eta || oldEta;
        let etaNote = "";
        if (oldEta && row.eta && oldEta !== row.eta) etaNote = `تغير موعد الوصول من ${sheetDay(oldEta)} إلى ${sheetDay(row.eta)}`;
        if (!linked[0]) {
          await sql.query(
            `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, note, category, track_url)
             values ($1,$2,$3,'40 قدم','','transit',$4,$5,$6,'fish',$7)`,
            [crypto.randomUUID(), userId, row.container, nextEta || null, row.invoice, row.invoiceNote || row.product, row.track],
          );
        } else if (row.eta && oldEta !== row.eta) {
          await sql.query(
            `update containers set eta = $1, invoice_number = $2, eta_note = $3, eta_snapshot = $4, eta_checked = $5,
              track_url = case when $6 <> '' then $6 else track_url end
             where id = $7`,
            [row.eta, row.invoice, etaNote, row.eta, today, row.track, linked[0].id],
          );
        }
      }
    }
    await sql.query("insert into app_flags (key, value) values ('fish-sheet-2026-10-14', '1') on conflict (key) do nothing");
    await sql.query("commit");
  } catch (error) {
    await sql.query("rollback");
    throw error;
  }
}

type SheetPay = { a: number; d: string; note?: string };
type SheetLine = { n: string; fish?: boolean; amount?: number; box?: string; pays: SheetPay[] };

const sheetLinesOct28: SheetLine[] = [
  { n: "87193", box: "MNBU9155774", pays: [{ a: 70000, d: "2026-01-08" }, { a: 27934, d: "2026-04-06" }, { a: 17666, d: "2026-04-13" }] },
  { n: "7737", box: "OOLU6256358", pays: [{ a: 65000, d: "2026-12-31" }, { a: 140500, d: "2026-03-10" }] },
  { n: "89401-2", box: "MNBU0530513", pays: [{ a: 60000, d: "2026-06-08" }, { a: 50000, d: "2026-06-14" }, { a: 45000, d: "2026-06-18" }, { a: 60000, d: "2026-10-19" }, { a: 99758, d: "2026-10-22" }] },
  { n: "89977", box: "MSDU9702409", pays: [{ a: 63000, d: "2026-06-15" }, { a: 50000, d: "2026-06-17" }, { a: 50000, d: "2026-10-13" }, { a: 50580, d: "2026-10-28" }, { a: 5927.33, d: "2026-10-26", note: "خصم حسب الإيميل 26-10-2026" }, { a: 70000, d: "2026-10-31", note: "من الجدول 31-10، التاريخ غير مذكور" }] },
  { n: "AR-19559", box: "MCAU6018450", pays: [{ a: 65000, d: "2026-07-20" }, { a: 62460, d: "2026-07-20", note: "تم دفعها ونور نسي يصور ورقة التحويل" }] },
  { n: "ALC263729", box: "OTPU6453279", pays: [{ a: 120000, d: "2026-07-13" }, { a: 55000, d: "2026-10-14", note: "التاريخ غير موجود بالملف" }, { a: 51034, d: "2026-10-14", note: "التاريخ غير موجود بالملف" }] },
  { n: "AR/19878", box: "MCAU6073605", pays: [{ a: 150000, d: "2026-07-23" }] },
  { n: "91321", box: "SUDU6248539", pays: [{ a: 130000, d: "2026-08-27" }] },
  { n: "ALC264448", box: "MSDU3080545", pays: [{ a: 63000, d: "2026-09-15" }, { a: 63378, d: "2026-09-30" }] },
  { n: "174926", box: "FBIU5940270", pays: [{ a: 35000, d: "2026-08-11" }, { a: 56007, d: "2026-10-11" }] },
  { n: "91357-1", box: "241ISZ2634147", pays: [{ a: 52000, d: "2026-08-19" }] },
  { n: "91357-2", box: "MNBU3273050", pays: [{ a: 52000, d: "2026-08-19" }] },
  { n: "ALC264447", box: "MSDU3006234", pays: [{ a: 63000, d: "2026-09-15" }, { a: 65501, d: "2026-10-14" }] },
  { n: "180626", box: "OERU4099396", pays: [{ a: 55000, d: "2026-09-01" }] },
  { n: "180526", box: "MMAU1478750", pays: [{ a: 55000, d: "2026-09-02" }, { a: 80924.97, d: "2026-09-30" }, { a: 42691, d: "2026-10-08" }] },
  { n: "83776-1RS", box: "MEDUR3535800", pays: [{ a: 210000, d: "2026-09-17" }, { a: 4751, d: "2026-09-17", note: "التاريخ غير موجود بالملف" }] },
  { n: "84583-8S", box: "MEDUR3535834", pays: [{ a: 140000, d: "2026-09-17" }, { a: 2766, d: "2026-09-17", note: "التاريخ غير موجود بالملف" }] },
  { n: "83208-6S", box: "MEDUR3535768", pays: [{ a: 140000, d: "2026-09-17" }, { a: 2907, d: "2026-09-17", note: "التاريخ غير موجود بالملف" }] },
  { n: "185626", box: "OERU4431242", pays: [{ a: 42100, d: "2026-09-30" }] },
  { n: "92017-2", pays: [{ a: 93000, d: "2026-10-13" }] },
  { n: "189026", box: "MNBU4093880", pays: [{ a: 40000, d: "2026-10-19" }] },
  { n: "188926", box: "MNBU3970141", pays: [{ a: 60000, d: "2026-10-26" }] },
  { n: "FTF0605-NAF02-26", fish: true, box: "EMCU5694025", pays: [{ a: 25000, d: "2026-10-03", note: "التاريخ غير موجود بالملف" }] },
  { n: "026/096", fish: true, amount: 67200, box: "MNBU9064231", pays: [{ a: 35000, d: "2026-09-03" }, { a: 32200, d: "2026-11-08", note: "من الجدول، التاريخ غير مذكور" }] },
  { n: "PI NAF03", fish: true, pays: [{ a: 30000, d: "2026-08-24" }] },
  { n: "7", fish: true, amount: 269432.5, box: "SUDU6171226", pays: [{ a: 70000, d: "2026-10-06" }, { a: 50000, d: "2026-10-14" }, { a: 70000, d: "2026-10-14", note: "التاريخ غير موجود بالملف" }, { a: 79432.5, d: "2026-10-28" }] },
  { n: "PROFORMA 60851", fish: true, box: "OERU4436178", pays: [{ a: 25000, d: "2026-09-28" }] },
  { n: "026/105", fish: true, pays: [{ a: 35000, d: "2026-09-28" }] },
  { n: "026/101", fish: true, box: "SUDU6178365", pays: [{ a: 30000, d: "2026-10-14", note: "التاريخ غير موجود بالملف" }] },
  { n: "9108", fish: true, box: "MNBU3358687", pays: [{ a: 40000, d: "2026-10-04" }] },
];

export async function syncSheetLinesOct28(sql: Sql) {
  const ready = await sql<{ id: string }>`select id from invoices where trim(number) = '89977' and coalesce(category, 'meat') <> 'fish' limit 1`;
  if (!ready.length) return;
  const lineEta: Record<string, string> = {
    "87193": "2026-04-22",
    "7737": "2026-03-30",
    "89401-2": "2026-10-31",
    "89977": "2026-11-03",
    "AR-19559": "2026-09-17",
    ALC263729: "2026-11-16",
    "AR/19878": "2026-12-10",
    "91321": "2026-12-19",
    ALC264448: "2026-11-16",
    "174926": "2026-10-28",
    "91357-1": "2026-12-12",
    "91357-2": "2026-11-16",
    ALC264447: "2026-10-29",
    "180626": "2026-11-30",
    "180526": "2026-10-27",
    "83776-1RS": "2026-12-06",
    "84583-8S": "2026-12-06",
    "83208-6S": "2026-12-06",
    "185626": "2026-12-14",
    "189026": "2026-12-12",
    "188926": "2026-12-12",
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
  const arrivals = [
    ...sheetLinesOct28.map((line) => ({ n: line.n, fish: Boolean(line.fish), box: line.box ?? "", eta: lineEta[line.n] ?? "" })),
    { n: "8", fish: true, box: "MNBU9146710", eta: "2026-10-31" },
    { n: "13", fish: true, box: "SUDU6103772", eta: "2026-10-31" },
    { n: "14", fish: true, box: "MNBU9014288", eta: "2026-10-31" },
  ];
  for (const job of arrivals) {
    const category = job.fish ? "fish" : "meat";
    if (job.box) {
      await sql.query(
        `update invoices set container_number = $1 where trim(number) = $2 and coalesce(category, 'meat') = $3`,
        [job.box, job.n, category],
      );
    }
    if (!job.box && !job.eta) continue;
    const boxes = await sql<{ id: string }>`
      select id from containers
      where coalesce(category, 'meat') = ${category}
        and (invoice_number = ${job.n} or (${job.box} <> '' and trim(number) = ${job.box}))
      limit 1
    `;
    if (boxes[0]) {
      await sql.query(
        `update containers set number = case when $1 <> '' then $1 else number end, invoice_number = $2, eta = case when $3 <> '' then $3::date else eta end where id = $4`,
        [job.box, job.n, job.eta, boxes[0].id],
      );
    } else {
      await sql.query(
        `insert into containers (id, user_id, number, type, port, status, eta, invoice_number, category)
         values ($1, 'sheet', $2, '40 قدم', '', 'transit', $3, $4, $5)`,
        [crypto.randomUUID(), job.box, job.eta || null, job.n, category],
      );
    }
  }
  const lineAmount: Record<string, number> = {
    "AR/19878": 299582,
    "91357-1": 169696.25,
    "91357-2": 135658.9,
    "180626": 178540.6,
    "84583-8S": 142197.25,
    "83208-6S": 142279.45,
    "185626": 139655.78,
    "189026": 129519.29,
    "188926": 192973.02,
  };
  for (const [number, amount] of Object.entries(lineAmount)) {
    await sql.query(
      `update invoices set amount = $1
       where trim(number) = $2 and coalesce(category, 'meat') <> 'fish'`,
      [amount, number],
    );
  }
  await sql.query(
    `update invoices set amount = 67200 where trim(number) = '026/096' and category = 'fish'`,
  );
  await sql.query(
    `update invoices set product = 'دينيس سمك أرجنتيني' where trim(number) = '26/120' and category = 'fish'`,
  );
  for (const line of sheetLinesOct28) {
    const sheetSum = Math.round(line.pays.reduce((sum, pay) => sum + pay.a, 0) * 100) / 100;
    const found = await sql<{ id: string; user_id: string; paid: string; stamped: string }>`
      select id, user_id,
        (select coalesce(sum(amount), 0) from payments p where p.invoice_id = invoices.id)::text as paid,
        (select count(*) from payments p where p.invoice_id = invoices.id and p.id like 'pay-sheet28-%')::text as stamped
      from invoices
      where trim(number) = ${line.n} and coalesce(category, 'meat') = ${line.fish ? "fish" : "meat"}
      limit 1
    `;
    const invoice = found[0];
    if (!invoice || Number(invoice.stamped) > 0 || Number(invoice.paid) + 0.05 >= sheetSum) continue;
    await sql.query(`delete from payments where invoice_id = $1`, [invoice.id]);
    for (let index = 0; index < line.pays.length; index += 1) {
      const pay = line.pays[index];
      await sql.query(
        `insert into payments (id, user_id, invoice_id, amount, paid_on, note)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (id) do nothing`,
        [`pay-sheet28-${line.fish ? "f" : "m"}-${line.n}-${index}-${invoice.id}`, invoice.user_id || "sheet", invoice.id, pay.a, pay.d, pay.note ?? ""],
      );
    }
  }
  const topUps = [
    { n: "89977", fish: false, id: "pay-sheet-89977-close", amount: 62072.67, date: "2026-11-05" },
    { n: "FTF0605-NAF02-26", fish: true, id: "pay-sheet-ftf-close", amount: 24200, date: "2026-11-05" },
    { n: "026/096", fish: true, id: "pay-sheet-096-close", amount: 32200, date: "2026-11-08" },
    { n: "26/120", fish: true, id: "pay-sheet-26120-1", amount: 18200, date: "2026-11-08" },
  ];
  for (const top of topUps) {
    const found = await sql<{ id: string; user_id: string; amount: string; paid: string }>`
      select id, user_id, amount::text as amount,
        (select coalesce(sum(amount), 0) from payments p where p.invoice_id = invoices.id)::text as paid
      from invoices
      where trim(number) = ${top.n} and coalesce(category, 'meat') = ${top.fish ? "fish" : "meat"}
      limit 1
    `;
    const invoice = found[0];
    if (!invoice) continue;
    const gap = Math.round((Number(invoice.amount) - Number(invoice.paid)) * 100) / 100;
    if (!(gap >= 5) || top.amount - gap > 1) continue;
    const amount = Math.min(gap, top.amount);
    await sql.query(
      `insert into payments (id, user_id, invoice_id, amount, paid_on, note)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`,
      [top.id, invoice.user_id || "sheet", invoice.id, amount, top.date, "من الجدول، التاريخ غير مذكور"],
    );
  }
  const fishNew = await sql<{ id: string }>`select id from invoices where trim(number) = '26/120' and category = 'fish' limit 1`;
  if (!fishNew.length) {
    const sample = await sql<{ user_id: string; importer: string }>`
      select user_id, importer from invoices where trim(number) = '026/101' and category = 'fish' limit 1
    `;
    const owner = sample[0]?.user_id || "sheet";
    const importer = sample[0]?.importer || "—";
    await sql.query(
      `insert into invoices (
        id, user_id, number, supplier, importer, product, amount, currency, status, note, container_number,
        agri_license, agri_available, beitel_license, beitel_available, category
      ) values ($1,$2,'26/120',$3,$4,$5,36400,'USD','pending',$6,'','',false,'',false,'fish')
      on conflict (id) do nothing`,
      ["fish-26-120", owner, "سمك أرجنتيني حاوية 9", importer, "دينيس سمك أرجنتيني", "لا تفاصيل إلى الآن"],
    );
  }
  await sql.query(
    `update invoices set product = 'دينيس سمك أرجنتيني' where trim(number) = '26/120' and category = 'fish'`,
  );
  const fishPay = await sql<{ id: string; user_id: string; amount: string; paid: string }>`
    select id, user_id, amount::text as amount,
      (select coalesce(sum(amount), 0) from payments p where p.invoice_id = invoices.id)::text as paid
    from invoices
    where trim(number) = '26/120' and category = 'fish'
    limit 1
  `;
  const fishInvoice = fishPay[0];
  if (fishInvoice) {
    const gap = Math.round((Number(fishInvoice.amount) - Number(fishInvoice.paid)) * 100) / 100;
    if (gap + 0.05 >= 18200) {
      await sql.query(
        `insert into payments (id, user_id, invoice_id, amount, paid_on, note)
         values ($1,$2,$3,18200,'2026-11-08',$4)
         on conflict (id) do nothing`,
        ["pay-sheet-26120-1", fishInvoice.user_id || "sheet", fishInvoice.id, "من الجدول، التاريخ غير مذكور"],
      );
    }
  }
  await sql.query("insert into app_flags (key, value) values ('sheet-payments-keep', '1') on conflict (key) do nothing");
}
