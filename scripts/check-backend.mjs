import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
const temp = await mkdtemp(tmpdir() + "/dexterous-test-");
const port = 4189,
  base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["server.mjs"], {
  env: {
    ...process.env,
    PORT: String(port),
    LOCAL_DATABASE_PATH: temp + "/test.sqlite",
    VERCEL_URL: "preview.dexterous.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "dexterous.vercel.app",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
try {
  await new Promise((resolve, reject) => {
    server.stdout.once("data", resolve);
    server.once("error", reject);
    setTimeout(() => reject(Error("Server start timed out")), 5000).unref();
  });
  async function call(path, body, token, method = "POST", origin) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: r.status, data: await r.json() };
  }
  assert.equal(
    (await call("/api/health", null, null, "GET")).data.database,
    true,
  );
  assert.equal(
    (
      await call(
        "/api/health",
        null,
        null,
        "GET",
        "https://preview.dexterous.vercel.app",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/api/health",
        null,
        null,
        "GET",
        "https://dexterous.vercel.app",
      )
    ).status,
    200,
  );
  const alice = (
    await call("/api/auth/signup", {
      name: "Field tester A",
      email: "a@example.test",
      password: "Twelve-plus-test-letters!",
    })
  ).data;
  const bob = (
    await call("/api/auth/signup", {
      name: "Field tester B",
      email: "b@example.test",
      password: "Another-long-test-password!",
    })
  ).data;
  assert.ok(alice.token && bob.token && alice.recoveryCode);
  assert.equal((await call("/api/state", null, null, "GET")).status, 401);
  const initial = (await call("/api/state", null, alice.token, "GET")).data;
  initial.state.collection["25"] = { caught: true, note: "Private note A" };
  assert.equal(
    (
      await call(
        "/api/state",
        { state: initial.state, revision: 0 },
        alice.token,
        "PUT",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        "/api/state",
        { state: initial.state, revision: 0 },
        alice.token,
        "PUT",
      )
    ).status,
    409,
  );
  assert.equal(
    Object.keys(
      (await call("/api/state", null, bob.token, "GET")).data.state.collection,
    ).length,
    0,
  );
  assert.equal(
    (
      await call(
        "/api/state",
        null,
        alice.token,
        "GET",
        "https://unrelated.invalid",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call("/api/auth/login", {
        email: "a@example.test",
        password: "A wrong password here",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/auth/login", {
        email: "a@example.test",
        password: "Twelve-plus-test-letters!",
      })
    ).status,
    200,
  );
  const recovered = await call("/api/auth/recover", {
    email: "a@example.test",
    password: "A new long password here!",
    recoveryCode: alice.recoveryCode,
  });
  assert.equal(recovered.status, 200);
  assert.equal(
    (await call("/api/state", null, alice.token, "GET")).status,
    401,
  );
  assert.equal(
    (await call("/api/state", null, recovered.data.token, "GET")).data.state
      .collection["25"].note,
    "Private note A",
  );
  assert.equal(
    (
      await call("/api/auth/recover", {
        email: "a@example.test",
        password: "Another long password here!",
        recoveryCode: alice.recoveryCode,
      })
    ).status,
    401,
  );
  await call("/api/auth/logout", {}, bob.token);
  assert.equal((await call("/api/state", null, bob.token, "GET")).status, 401);
  console.log(
    "PASS: signup, login, account isolation, CORS, revision conflicts, recovery rotation and logout.",
  );
} finally {
  server.kill();
  await new Promise((r) => server.once("exit", r));
  await rm(temp, { recursive: true, force: true });
}
