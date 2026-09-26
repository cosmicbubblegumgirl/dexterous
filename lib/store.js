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
const cloudUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
const cloudKey = String(config.supabaseKey || "");
const supabaseEnabled = !!(cloudUrl && cloudKey);

function sessionKey() {
  return "dex-session";
}
function saveSession() {
  if (store.session) localStorage.setItem(sessionKey(), JSON.stringify(store.session));
  else localStorage.removeItem(sessionKey());
  sessionStorage.removeItem(sessionKey());
}
function authSession(data, fallbackName = "Trainer") {
  const user = data?.user || {};
  const metadata = user.user_metadata || {};
  const expiresAt = data.expires_at
    ? Number(data.expires_at) * 1000
    : Date.now() + Number(data.expires_in || 3600) * 1000;
  return {
    provider: "supabase",
    token: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresAt,
    user: {
      id: user.id,
      email: user.email || "",
      name: String(metadata.name || metadata.trainer_name || fallbackName || "Trainer").slice(0, 50),
    },
  };
}
async function supa(path, options = {}) {
  const method = options.method || "GET";
  const headers = {
    apikey: cloudKey,
    "Content-Type": "application/json",
    ...(options.prefer ? { Prefer: options.prefer } : {}),
  };
  const token =
    options.token === undefined ? store.session?.token : options.token;
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch(cloudUrl + path, {
    method,
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message =
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error?.message ||
      data?.error ||
      "That cloud request could not be completed.";
    const error = Error(String(message));
    error.status = response.status;
    throw error;
  }
  return data;
}
async function refreshCloudSession() {
  if (!supabaseEnabled || store.session?.provider !== "supabase") return;
  if (store.session.expiresAt && store.session.expiresAt > Date.now() + 60000)
    return;
  if (!store.session.refreshToken)
    throw Error("Your session expired. Please log in again.");
  const data = await supa("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: store.session.refreshToken },
    token: null,
  });
  store.session = authSession(data, store.session.user?.name);
  saveSession();
}
async function cloudRows(uid) {
  return await supa(
    "/rest/v1/dexterous_field_guides?select=data,revision&user_id=eq." +
      encodeURIComponent(uid) +
      "&limit=1",
  );
}
async function loadCloud() {
  await refreshCloudSession();
  const uid = store.session?.user?.id;
  if (!uid) throw Error("Please log in to continue.");
  let rows = await cloudRows(uid);
  if (!rows?.length) {
    const state = fresh();
    state.profile.name = store.session.user.name || "Trainer";
    try {
      rows = await supa("/rest/v1/dexterous_field_guides", {
        method: "POST",
        body: { user_id: uid, data: state, revision: 0 },
        prefer: "return=representation",
      });
    } catch (error) {
      if (error.status !== 409) throw error;
      rows = await cloudRows(uid);
    }
  }
  const row = rows?.[0] || { data: fresh(), revision: 0 };
  store.data = withDefaults(row.data);
  store.revision = Number(row.revision || 0);
  store.status = "Synced to your account";
  await localWrite("user:" + uid, store.data);
}
export async function request(path, body, method) {
  if (!base)
    throw Error(
      "This feature needs the hosted app. Your collection is still safe on this device.",
    );
  const response = await fetch(base + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(store.session?.provider !== "supabase" && store.session?.token
        ? { Authorization: "Bearer " + store.session.token }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Error(data.error || "That request could not be completed.");
  return data;
}
export async function init() {
  let d;
  try {
    d = await localRead("guest");
  } catch {
    store.status = "Storage unavailable · export before leaving";
  }
  if (d) store.data = withDefaults(d);
  try {
    store.session = JSON.parse(
      localStorage.getItem(sessionKey()) ||
        sessionStorage.getItem(sessionKey()) ||
        "null",
    );
  } catch {
    store.session = null;
  }
  if (supabaseEnabled) {
    if (store.session && store.session.provider !== "supabase") {
      store.session = null;
      saveSession();
    }
    try {
      await supa(
        "/rest/v1/dexterous_field_guides?select=user_id&limit=0",
        { token: null },
      );
      store.backend = true;
      if (store.session) await loadCloud();
    } catch {
      store.backend = false;
      store.status = "Cloud unavailable · device copy active";
      if (store.session?.user?.id) {
        try {
          const local = await localRead("user:" + store.session.user.id);
          store.data = withDefaults(local || fresh());
        } catch {}
      }
    }
    return store;
  }
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
    store.status = "Could not save · export a backup";
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
        if (supabaseEnabled && store.session.provider === "supabase") {
          await refreshCloudSession();
          const uid = store.session.user.id;
          const nextRevision = store.revision + 1;
          const rows = await supa(
            "/rest/v1/dexterous_field_guides?select=revision&user_id=eq." +
              encodeURIComponent(uid) +
              "&revision=eq." +
              store.revision,
            {
              method: "PATCH",
              body: {
                data: store.data,
                revision: nextRevision,
                updated_at: new Date().toISOString(),
              },
              prefer: "return=representation",
            },
          );
          if (!rows?.length)
            throw Error(
              "Your collection changed on another device. Export this copy, then sign in again before merging.",
            );
          store.revision = Number(rows[0].revision);
        } else {
          const r = await request(
            "/api/state",
            { state: store.data, revision: store.revision },
            "PUT",
          );
          store.revision = r.revision;
        }
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
  const email = String(values.email || "").trim().toLowerCase();
  const password = String(values.password || "");
  const name = String(values.name || "").trim().slice(0, 50);
  if (!supabaseEnabled) {
    const r = await request("/api/auth/" + mode, values);
    store.session = r;
    sessionStorage.setItem(sessionKey(), JSON.stringify(r));
    await loadCloud();
    return r;
  }
  if (mode === "signup") {
    const data = await supa("/auth/v1/signup", {
      method: "POST",
      body: {
        email,
        password,
        data: { name },
      },
      token: null,
    });
    if (!data?.access_token) {
      return {
        confirmationRequired: true,
        user: { email, name },
      };
    }
    store.session = authSession(data, name);
    saveSession();
    await loadCloud();
    return store.session;
  }
  if (mode === "login") {
    const data = await supa("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
      token: null,
    });
    store.session = authSession(data);
    saveSession();
    await loadCloud();
    return store.session;
  }
  if (mode === "recover") {
    await supa("/auth/v1/recover", {
      method: "POST",
      body: { email },
      token: null,
    });
    return { resetRequested: true, user: { email } };
  }
  throw Error("Unknown account action.");
}
export async function logout() {
  clearTimeout(timer);
  if (store.session) await sync();
  if (supabaseEnabled && store.session?.provider === "supabase") {
    try {
      await supa("/auth/v1/logout", { method: "POST" });
    } catch {}
  } else {
    try {
      await request("/api/auth/logout", {});
    } catch {}
  }
  store.session = null;
  saveSession();
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
