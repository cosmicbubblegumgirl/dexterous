import {
  randomBytes,
  randomUUID,
  scrypt as scryptCb,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCb),
  hash = (s) => createHash("sha256").update(s).digest("hex");
let query, ready;
const defaultState = () => ({
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
async function db() {
  if (ready) return ready;
  ready = (async () => {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.yuvertel_DATABASE_URL ||
      process.env.yuvertel_POSTGRES_URL ||
      process.env.POSTGRES_URL;
    if (connectionString) {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(connectionString);
      query = async (text, params = []) => {
        let i = 0;
        return await sql.query(
          text.replace(/\?/g, () => "$" + ++i),
          params,
        );
      };
    } else if (process.env.LOCAL_DATABASE_PATH && !process.env.VERCEL) {
      const { DatabaseSync } = await import("node:sqlite");
      const connection = new DatabaseSync(process.env.LOCAL_DATABASE_PATH);
      connection.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
      query = async (text, params = []) =>
        connection.prepare(text).all(...params);
    } else throw Error("Database is not configured.");
    for (const statement of [
      "CREATE TABLE IF NOT EXISTS trainers (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, recovery_hash TEXT NOT NULL, created_at BIGINT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE, expires_at BIGINT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS field_guides (user_id TEXT PRIMARY KEY REFERENCES trainers(id) ON DELETE CASCADE, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)",
      "CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start BIGINT NOT NULL)",
    ])
      await query(statement);
    return query;
  })();
  return ready;
}
async function passwordHash(password, salt) {
  return Buffer.from(
    await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }),
  ).toString("hex");
}
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
class Fault extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
async function limit(key, max = 12, seconds = 900) {
  const q = await db(),
    now = Date.now(),
    bucket = Math.floor(now / (seconds * 1000));
  const k = hash(key) + ":" + bucket;
  const rows = await q(
    "INSERT INTO rate_limits(key,attempts,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=rate_limits.attempts+1 RETURNING attempts",
    [k, now],
  );
  if (rows[0].attempts > max)
    throw new Fault(429, "Too many attempts. Try again in a few minutes.");
  if (Math.random() < 0.01)
    await q("DELETE FROM rate_limits WHERE window_start < ?", [now - 86400000]);
}
async function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Fault(401, "Please log in to continue.");
  const q = await db();
  const rows = await q(
    "SELECT trainers.id,trainers.email,trainers.name FROM sessions JOIN trainers ON trainers.id=sessions.user_id WHERE token_hash=? AND expires_at>?",
    [hash(token), Date.now()],
  );
  if (!rows[0])
    throw new Fault(401, "Your session expired. Please log in again.");
  return rows[0];
}
async function newSession(user, recoveryCode) {
  const q = await db(),
    token = randomBytes(32).toString("hex");
  await q(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)",
    [hash(token), user.id, Date.now() + 7 * 86400000],
  );
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
    ...(recoveryCode ? { recoveryCode } : {}),
  };
}
async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    if (JSON.stringify(req.body).length > 500000)
      throw new Fault(413, "That request is too large.");
    return req.body;
  }
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 500000)
      throw new Fault(413, "That request is too large.");
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Fault(400, "Invalid request.");
  }
}
function sanitizeState(s) {
  if (
    !s ||
    typeof s !== "object" ||
    !s.collection ||
    Array.isArray(s.collection)
  )
    throw new Fault(400, "Invalid field guide.");
  const clean = defaultState();
  const str = (v, n) => String(v ?? "").slice(0, n);
  for (const [id, x] of Object.entries(s.collection)) {
    if (!/^\d{1,5}$/.test(id) || !x || typeof x !== "object") continue;
    clean.collection[id] = {};
    for (const k of [
      "caught",
      "seen",
      "shiny",
      "lucky",
      "favourite",
      "wishlist",
      "trade",
      "chaos",
    ])
      clean.collection[id][k] = !!x[k];
    for (const [k, n] of [
      ["nickname", 80],
      ["note", 1000],
      ["date", 10],
      ["location", 100],
      ["tags", 200],
    ])
      clean.collection[id][k] = str(x[k], n);
    clean.collection[id].source = x.source === "go" ? "go" : "main";
    clean.collection[id].count = Math.min(999, Math.max(1, +x.count || 1));
  }
  clean.team = Array.isArray(s.team)
    ? [
        ...new Set(
          s.team.filter((x) => Number.isInteger(x) && x > 0 && x < 20000),
        ),
      ].slice(0, 6)
    : [];
  clean.journal = Array.isArray(s.journal)
    ? s.journal
        .slice(-300)
        .map((x) => ({
          id: str(x.id, 50),
          title: str(x.title, 100),
          body: str(x.body, 3000),
          date: str(x.date, 10),
          distance: Math.max(0, Math.min(500, +x.distance || 0)),
        }))
    : [];
  clean.goals = Array.isArray(s.goals)
    ? s.goals
        .slice(-100)
        .map((x) => ({
          id: str(x.id, 50),
          text: str(x.text, 200),
          done: !!x.done,
          date: str(x.date, 10),
        }))
    : [];
  if (s.profile)
    clean.profile = {
      name: str(s.profile.name, 50),
      bio: str(s.profile.bio, 200),
      friendCode: str(s.profile.friendCode, 20),
      team: ["Instinct", "Mystic", "Valor", "Still deciding"].includes(
        s.profile.team,
      )
        ? s.profile.team
        : "Instinct",
      buddy: Number.isInteger(s.profile.buddy) ? s.profile.buddy : 25,
    };
  if (s.preferences) {
    const legacyTheme = ["dark", "light", "lab"].includes(
      s.preferences.theme,
    )
      ? s.preferences.theme
      : null;
    clean.preferences = {
      theme: ["meadow", "sky", "peach", "lab"].includes(
        s.preferences.theme,
      )
        ? s.preferences.theme
        : legacyTheme === "lab"
          ? "lab"
          : "meadow",
      mode: ["light", "dark"].includes(s.preferences.mode)
        ? s.preferences.mode
        : legacyTheme === "light"
          ? "light"
          : "dark",
      blueLight: s.preferences.blueLight === true,
      motion: s.preferences.motion !== false,
      font: s.preferences.font === "large" ? "large" : "normal",
    };
  }
  clean.checks = Object.fromEntries(
    Object.entries(s.checks || {})
      .filter(([k]) => /^go-\d$/.test(k))
      .map(([k, v]) => [k, !!v]),
  );
  clean.quiz = { best: Math.max(0, Math.min(5, +s.quiz?.best || 0)) };
  return clean;
}
export async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = new Set((
    process.env.ALLOWED_ORIGINS ||
    "https://cosmicbubblegumgirl.github.io,http://localhost:4173,http://127.0.0.1:4173"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean));
  for (const host of [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (host) allowed.add(`https://${host}`);
  }
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Origin");
  const send = (status, data) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };
  if (origin && !allowed.has(origin))
    return send(403, { error: "This origin is not allowed." });
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  const path = new URL(req.url, "http://localhost").pathname.replace(/\/$/, "");
  try {
    if (path === "/api/health") {
      let database = false;
      try {
        await db();
        database = true;
      } catch {}
      return send(200, {
        database,
      });
    }
    const q = await db();
    const ip =
      req.headers["x-vercel-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown";
    if (path.startsWith("/api/auth/") && req.method === "POST") {
      const mode = path.split("/").at(-1);
      if (mode === "logout") {
        const token = (req.headers.authorization || "").replace(/^Bearer /, "");
        await q("DELETE FROM sessions WHERE token_hash=?", [hash(token)]);
        return send(200, { ok: true });
      }
      await limit("ip:" + ip, 35);
      const body = await readBody(req),
        email = String(body.email || "")
          .trim()
          .toLowerCase(),
        password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        throw new Fault(400, "Enter a valid email address.");
      if (password.length < 12 || password.length > 128)
        throw new Fault(400, "Use a password between 12 and 128 characters.");
      await limit("email:" + email, 10);
      const rows = await q("SELECT * FROM trainers WHERE email=?", [email]);
      if (mode === "signup") {
        const name = String(body.name || "")
          .trim()
          .slice(0, 50);
        if (!name) throw new Fault(400, "Choose a trainer name.");
        if (rows.length)
          throw new Fault(
            409,
            "An account could not be created with these details. Try logging in or recovering your account.",
          );
        const id = randomUUID(),
          salt = randomBytes(16).toString("hex"),
          recoveryCode = randomBytes(24).toString("hex");
        const digest = await passwordHash(password, salt);
        try {
          await q(
            "INSERT INTO trainers(id,email,name,password_hash,salt,recovery_hash,created_at) VALUES (?,?,?,?,?,?,?)",
            [id, email, name, digest, salt, hash(recoveryCode), Date.now()],
          );
        } catch (e) {
          throw new Fault(
            409,
            "An account could not be created with these details.",
          );
        }
        const state = defaultState();
        state.profile.name = name;
        await q(
          "INSERT INTO field_guides(user_id,data,revision) VALUES (?,?,0)",
          [id, JSON.stringify(state)],
        );
        return send(201, await newSession({ id, email, name }, recoveryCode));
      }
      if (mode === "login") {
        const user = rows[0];
        const candidate = await passwordHash(
          password,
          user?.salt || "00000000000000000000000000000000",
        );
        if (!user || !safeEqual(candidate, user.password_hash))
          throw new Fault(401, "Email or password is incorrect.");
        return send(200, await newSession(user));
      }
      if (mode === "recover") {
        const user = rows[0];
        const code = String(body.recoveryCode || "").trim();
        if (!user || !safeEqual(hash(code), user.recovery_hash))
          throw new Fault(401, "Email or recovery code is incorrect.");
        const salt = randomBytes(16).toString("hex"),
          recoveryCode = randomBytes(24).toString("hex");
        await q(
          "UPDATE trainers SET password_hash=?,salt=?,recovery_hash=? WHERE id=?",
          [
            await passwordHash(password, salt),
            salt,
            hash(recoveryCode),
            user.id,
          ],
        );
        await q("DELETE FROM sessions WHERE user_id=?", [user.id]);
        return send(200, await newSession(user, recoveryCode));
      }
      throw new Fault(404, "Unknown account action.");
    }
    if (path === "/api/state") {
      const user = await getUser(req);
      if (req.method === "GET") {
        const rows = await q(
          "SELECT data,revision FROM field_guides WHERE user_id=?",
          [user.id],
        );
        if (!rows[0]) {
          const state = defaultState();
          state.profile.name = user.name;
          await q(
            "INSERT INTO field_guides(user_id,data,revision) VALUES (?,?,0) ON CONFLICT(user_id) DO NOTHING",
            [user.id, JSON.stringify(state)],
          );
          return send(200, { state, revision: 0 });
        }
        return send(200, {
          state: JSON.parse(rows[0].data),
          revision: rows[0].revision,
        });
      }
      if (req.method === "PUT") {
        const { state, revision } = await readBody(req);
        if (!Number.isInteger(revision) || revision < 0)
          throw new Fault(400, "Invalid revision.");
        const clean = sanitizeState(state);
        const rows = await q(
          "UPDATE field_guides SET data=?,revision=revision+1 WHERE user_id=? AND revision=? RETURNING revision",
          [JSON.stringify(clean), user.id, revision],
        );
        if (!rows.length)
          throw new Fault(
            409,
            "Your collection changed on another device. Export this copy, then sign in again before merging.",
          );
        return send(200, { ok: true, revision: rows[0].revision });
      }
    }
    throw new Fault(404, "That field guide route does not exist.");
  } catch (e) {
    return send(e.status || 503, {
      error: e.status
        ? e.message
        : "The cloud service is unavailable. Your device copy is safe.",
    });
  }
}
