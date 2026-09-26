import { config } from "../config.js";
const fresh = () => ({
  collection: {},
  team: [],
  journal: [],
  goals: [],
  checks: {},
  profile: {
    name: "Trainer",
    bio: "",
    team: "Instinct",
    buddy: 25,
    friendCode: "",
  },
  preferences: {
    theme: "meadow",
    mode: "light",
    blueLight: false,
    motion: true,
    font: "normal",
  },
  quiz: { best: 0 },
});
let database;
async function db() {
  if (database) return database;
  database = await new Promise((resolve, reject) => {
    const r = indexedDB.open("dexterous-field-guide", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("records");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return database;
}
async function localRead(key) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = d.transaction("records").objectStore("records").get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function localWrite(key, value) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction("records", "readwrite");
    t.objectStore("records").put(value, key);
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}
export const store = {
  data: fresh(),
  session: null,
  status: "Saved on this device",
  backend: false,
  revision: 0,
};
function withDefaults(data) {
  const defaults = fresh();
  const preferences = { ...defaults.preferences, ...(data?.preferences || {}) };
  if (["dark", "light", "lab"].includes(preferences.theme)) {
    preferences.mode = preferences.theme === "light" ? "light" : "dark";
    preferences.theme = preferences.theme === "lab" ? "lab" : "meadow";
  }
  return { ...defaults, ...data, preferences };
}
const base =
  config.apiBase ||
  (location.hostname.endsWith(".github.io") ? "" : location.origin);
export async function request(path, body, method) {
  if (!base)
    throw Error(
      "Cloud accounts are awaiting backend activation. Your guest collection works and saves on this device.",
    );
  const r = await fetch(base + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(store.session
        ? { Authorization: `Bearer ${store.session.token}` }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "That request could not be completed.");
  return d;
}
export async function init() {
  let d;
  try {
    d = await localRead("guest");
  } catch {
    store.status = "Storage unavailable — export before leaving";
  }
  if (d) store.data = withDefaults(d);
  try {
    store.session = JSON.parse(sessionStorage.getItem("dex-session"));
  } catch {}
  if (base) {
    try {
      const h = await request("/api/health");
      store.backend = h.database;
      if (store.session) await loadCloud();
    } catch {
      store.status = "Cloud unavailable · device copy active";
      if (store.session) {
        const local = await localRead("user:" + store.session.user.id);
        store.data = withDefaults(local || fresh());
      }
    }
  }
  return store;
}
async function loadCloud() {
  const r = await request("/api/state");
  store.data = withDefaults(r.state);
  store.revision = r.revision;
  store.status = "Synced to your account";
  await localWrite("user:" + store.session.user.id, store.data);
}
let timer;
export async function save() {
  try {
    await localWrite(
      store.session ? "user:" + store.session.user.id : "guest",
      store.data,
    );
    store.status = store.session
      ? "Saved on device · syncing…"
      : "Saved on this device";
  } catch {
    store.status = "Could not save — export a backup";
  }
  window.dispatchEvent(new Event("dex-status"));
  clearTimeout(timer);
  if (store.session) timer = setTimeout(sync, 700);
}
let syncTask = null,
  syncAgain = false;
export async function sync() {
  if (!store.session) return;
  if (syncTask) {
    syncAgain = true;
    return syncTask;
  }
  syncTask = (async () => {
    do {
      syncAgain = false;
      try {
        const r = await request(
          "/api/state",
          { state: store.data, revision: store.revision },
          "PUT",
        );
        store.revision = r.revision;
        store.status = "Synced to your account";
      } catch (e) {
        store.status = e.message.includes("another device")
          ? "Cloud changed on another device · export and sign in again"
          : "Saved on device · cloud sync failed";
        syncAgain = false;
        break;
      }
    } while (syncAgain);
    window.dispatchEvent(new Event("dex-status"));
  })();
  try {
    await syncTask;
  } finally {
    syncTask = null;
  }
}
export async function authenticate(mode, values) {
  const r = await request("/api/auth/" + mode, values);
  store.session = r;
  sessionStorage.setItem("dex-session", JSON.stringify(r));
  await loadCloud();
  return r;
}
export async function logout() {
  clearTimeout(timer);
  if (store.session) await sync();
  try {
    await request("/api/auth/logout", {});
  } catch {}
  store.session = null;
  sessionStorage.removeItem("dex-session");
  store.data = (await localRead("guest")) || fresh();
  store.status = "Saved on this device";
}
export async function importBackup(value) {
  if (
    !value ||
    value.format !== "dexterous-v1" ||
    !value.data ||
    typeof value.data.collection !== "object"
  )
    throw Error("Choose a Dexterous backup JSON file.");
  const d = value.data;
  const clean = fresh();
  clean.collection = {};
  for (const [id, item] of Object.entries(d.collection)) {
    if (!/^\d{1,5}$/.test(id) || !item || typeof item !== "object") continue;
    clean.collection[id] = {
      caught: !!item.caught,
      seen: !!item.seen,
      shiny: !!item.shiny,
      lucky: !!item.lucky,
      favourite: !!item.favourite,
      wishlist: !!item.wishlist,
      trade: !!item.trade,
      chaos: !!item.chaos,
      source: item.source === "go" ? "go" : "main",
      count: Math.min(999, Math.max(1, Number(item.count) || 1)),
      nickname: String(item.nickname || "").slice(0, 80),
      note: String(item.note || "").slice(0, 1000),
      date: String(item.date || "").slice(0, 10),
      location: String(item.location || "").slice(0, 100),
      tags: String(item.tags || "").slice(0, 200),
    };
  }
  clean.team = Array.isArray(d.team)
    ? [...new Set(d.team.filter(Number.isInteger))].slice(0, 6)
    : [];
  clean.journal = Array.isArray(d.journal)
    ? d.journal
        .slice(0, 300)
        .map((x) => ({
          id: crypto.randomUUID(),
          date: String(x.date || "").slice(0, 10),
          title: String(x.title || "").slice(0, 100),
          body: String(x.body || "").slice(0, 3000),
          distance: Math.max(0, Number(x.distance) || 0),
        }))
    : [];
  clean.goals = Array.isArray(d.goals)
    ? d.goals
        .slice(0, 100)
        .map((x) => ({
          id: crypto.randomUUID(),
          text: String(x.text || "").slice(0, 200),
          done: !!x.done,
          date: String(x.date || "").slice(0, 10),
        }))
    : [];
  if (d.profile)
    clean.profile = {
      ...clean.profile,
      name: String(d.profile.name || "Trainer").slice(0, 50),
      bio: String(d.profile.bio || "").slice(0, 200),
      buddy: Number(d.profile.buddy) || 25,
      friendCode: String(d.profile.friendCode || "").slice(0, 20),
    };
  store.data = clean;
  await save();
}
export function download(name, data, type = "application/json") {
  const blob = new Blob(
    [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
    { type },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
