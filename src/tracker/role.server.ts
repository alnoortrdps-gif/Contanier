import { getSql } from "@/lib/db";

const defaults = { hmood: "2841989", noor: "123321" } as const;
const roles = { hmood: "admin", noor: "viewer" } as const;

export type AppRole = "admin" | "viewer";

async function sessions() {
  const sql = await getSql();
  await sql.query(
    "create table if not exists role_sessions (token text primary key, role text not null, username text not null)",
  );
  await sql.query("create table if not exists app_flags (key text primary key, value text not null default '')");
  return sql;
}

export async function rolePasswords() {
  const sql = await sessions();
  const rows = await sql<{ value: string }>`select value from app_flags where key = 'role_passwords'`;
  let saved: Record<string, string> = {};
  try {
    saved = rows[0]?.value ? JSON.parse(rows[0].value) as Record<string, string> : {};
  } catch {
    saved = {};
  }
  return {
    hmood: !saved.hmood || saved.hmood === "123321" ? defaults.hmood : saved.hmood,
    noor: saved.noor || defaults.noor,
  };
}

export async function loginRoleAccount(username: string, password: string) {
  const name = username.trim().toLowerCase();
  if (name !== "hmood" && name !== "noor") return null;
  const passwords = await rolePasswords();
  if (passwords[name] !== password) return null;
  const token = crypto.randomUUID();
  const sql = await sessions();
  await sql`insert into role_sessions (token, role, username) values (${token}, ${roles[name]}, ${name})`;
  return { token, role: roles[name] as AppRole, username: name };
}

export async function changeRolePassword(username: string, current: string, next: string) {
  const name = username.trim().toLowerCase();
  if (name !== "hmood" && name !== "noor") return false;
  const passwords = await rolePasswords();
  if (passwords[name] !== current) return false;
  const sql = await sessions();
  const updated = { ...passwords, [name]: next };
  await sql.query(
    "insert into app_flags (key, value) values ('role_passwords', $1) on conflict (key) do update set value = excluded.value",
    [JSON.stringify(updated)],
  );
  return true;
}

export async function resolveRoleToken(token: string | undefined) {
  if (!token) return null;
  const sql = await sessions();
  const rows = await sql<{ role: string; username: string }>`select role, username from role_sessions where token = ${token}`;
  const row = rows[0];
  if (!row || (row.role !== "admin" && row.role !== "viewer")) return null;
  return { role: row.role as AppRole, username: row.username };
}

export async function logoutRoleToken(token: string | undefined) {
  if (!token) return;
  const sql = await sessions();
  await sql`delete from role_sessions where token = ${token}`;
}
