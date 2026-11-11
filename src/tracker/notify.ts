const FLAG = "marsa-notify";
const SEEN = "marsa-notify-seen";

export type PhoneAlert = { tag: string; title: string; body: string };

function seenTags() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function remember(tags: string[]) {
  const next = [...tags, ...seenTags()].slice(0, 300);
  window.localStorage.setItem(SEEN, JSON.stringify(next));
}

export function phoneAlertsOn() {
  return window.localStorage.getItem(FLAG) === "1" && "Notification" in window && Notification.permission === "granted";
}

export function disablePhoneAlerts() {
  window.localStorage.setItem(FLAG, "0");
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistration().then(async (registration) => {
      const notes = await registration?.getNotifications();
      notes?.forEach((note) => note.close());
    }).catch(() => {});
  }
}

export async function enablePhoneAlerts() {
  if (!("Notification" in window)) {
    throw new Error("هذا التلفون ما بدعم الإشعارات من المتصفح. على الآيفون أضف التطبيق للشاشة الرئيسية ثم فعّل الإشعارات.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("اسمح بالإشعارات من إعدادات التلفون. على الآيفون لازم التطبيق يكون على الشاشة الرئيسية.");
  }
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/notify-sw.js");
  }
  window.localStorage.setItem(FLAG, "1");
}

export async function showPhoneAlerts(items: PhoneAlert[], silent: PhoneAlert[] = []) {
  if (!phoneAlertsOn() || !items.length && !silent.length) {
    if (silent.length) remember(silent.map((item) => item.tag));
    return;
  }
  const known = new Set(seenTags());
  const fresh = items.filter((item) => item.tag && !known.has(item.tag)).slice(0, 5);
  remember([...fresh.map((item) => item.tag), ...silent.map((item) => item.tag)]);
  if (!fresh.length) return;
  let registration: ServiceWorkerRegistration | undefined;
  if ("serviceWorker" in navigator) {
    registration = await navigator.serviceWorker.getRegistration().catch(() => undefined);
  }
  for (const item of fresh) {
    if (registration) {
      await registration.showNotification(item.title, {
        body: item.body,
        tag: item.tag,
        lang: "ar",
        dir: "rtl",
      });
    } else {
      const note = new Notification(item.title, { body: item.body, tag: item.tag, lang: "ar", dir: "rtl" });
      note.onclick = () => window.focus();
    }
  }
}
