import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const backendDir = path.join(repoRoot, "sut", "eshop-sut", "backend");
const backendRequire = createRequire(path.join(backendDir, "package.json"));
const sqlite3 = backendRequire("sqlite3").verbose();
const databasePath = path.join(backendDir, "database.sqlite");
const db = new sqlite3.Database(databasePath);

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function callback(error) {
    if (error) reject(error);
    else resolve({ changes: this.changes, lastID: this.lastID });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function handler(request, response) {
  const url = new URL(request.url, "http://127.0.0.1:3001");
  try {
    if (request.method === "GET" && url.pathname === "/fixture/health") {
      return send(response, 200, { ok: true, databasePath });
    }

    if (request.method === "POST" && url.pathname === "/fixture/reset-token") {
      const { email, token } = await readJson(request);
      const result = await run("UPDATE users SET reset_token = ? WHERE email = ?", [token, email]);
      return send(response, result.changes === 1 ? 200 : 404, { updated: result.changes, token });
    }

    if (request.method === "POST" && url.pathname === "/fixture/coupon") {
      const body = await readJson(request);
      await run(
        `INSERT INTO coupons (code, type, discount_value, min_order_amount, expired_at, is_active, max_uses_per_user)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET type=excluded.type, discount_value=excluded.discount_value,
         min_order_amount=excluded.min_order_amount, expired_at=excluded.expired_at,
         is_active=excluded.is_active, max_uses_per_user=excluded.max_uses_per_user`,
        [body.code, body.type, body.discount_value, body.min_order_amount,
          body.expired_at, body.is_active, body.max_uses_per_user],
      );
      return send(response, 200, { seeded: body.code });
    }

    if (request.method === "POST" && url.pathname === "/fixture/coupon-usage") {
      const { code, user_id: userId, count } = await readJson(request);
      const coupon = await get("SELECT id FROM coupons WHERE code = ?", [code]);
      if (!coupon) return send(response, 404, { error: "Fixture coupon not found" });
      await run("DELETE FROM coupon_usage WHERE coupon_id = ? AND user_id = ?", [coupon.id, userId]);
      for (let index = 0; index < Number(count || 0); index += 1) {
        await run("INSERT INTO coupon_usage (coupon_id, user_id) VALUES (?, ?)", [coupon.id, userId]);
      }
      return send(response, 200, { code, user_id: userId, count: Number(count || 0) });
    }

    if (request.method === "GET" && url.pathname === "/fixture/coupon-usage") {
      const row = await get(
        `SELECT COUNT(*) AS count FROM coupon_usage cu
         JOIN coupons c ON c.id = cu.coupon_id
         WHERE c.code = ? AND cu.user_id = ?`,
        [url.searchParams.get("code"), Number(url.searchParams.get("user_id"))],
      );
      return send(response, 200, row || { count: 0 });
    }

    if (request.method === "GET" && url.pathname === "/fixture/schema/users") {
      const columns = await all("PRAGMA table_info(users)");
      return send(response, 200, { columns });
    }

    return send(response, 404, { error: "Unknown fixture route" });
  } catch (error) {
    return send(response, 500, { error: error.message });
  }
}

const server = http.createServer(handler);
server.listen(3001, "127.0.0.1", () => {
  console.log(`HW06 fixture server listening on http://127.0.0.1:3001 (${databasePath})`);
});

function shutdown() {
  server.close(() => db.close(() => process.exit(0)));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

