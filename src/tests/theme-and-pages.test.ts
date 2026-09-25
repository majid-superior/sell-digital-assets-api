import test from "node:test";
import assert from "node:assert/strict";
import request from "node:http";
import app from "../app.js";
import type { Server } from "node:http";

let server: Server;
let baseUrl: string;

function makeRequest(path: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = request.get(url, { headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf-8"),
        });
      });
    });
    req.on("error", reject);
  });
}

test("Theme assets, Status Dashboard, Error Page, and Swagger UI integration", async (t) => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  await t.test("1. Mounts /theme/fonts.css from @majid-superior/sell-digital-assets-theme", async () => {
    const res = await makeRequest("/theme/fonts.css");
    assert.equal(res.status, 200);
    assert.match(res.body, /font-family:\s*"Plus Jakarta Sans"/);
    assert.match(res.body, /PlusJakartaSans-Variable\.woff2/);
  });

  await t.test("2. Mounts /theme/theme.css with light and dark mode design tokens", async () => {
    const res = await makeRequest("/theme/theme.css");
    assert.equal(res.status, 200);
    assert.match(res.body, /--color-primary:/);
    assert.match(res.body, /--color-secondary:/);
    assert.match(res.body, /\[data-theme="dark"\]/);
    assert.match(res.body, /\.dark/);
  });

  await t.test("3. Mounts self-hosted font binary at /theme/assets/fonts/...", async () => {
    const res = await makeRequest("/theme/assets/fonts/plus-jakarta-sans/PlusJakartaSans-Variable.woff2");
    assert.equal(res.status, 200);
    assert.ok(res.body.length > 1000);
  });

  await t.test("4. Server Status Page (GET /) links to self-hosted theme and eliminates Google Fonts", async () => {
    const res = await makeRequest("/", { Accept: "text/html" });
    assert.equal(res.status, 200);
    assert.match(res.body, /href="\/theme\/fonts\.css"/);
    assert.match(res.body, /href="\/theme\/theme\.css"/);
    assert.match(res.body, /href="\/css\/style\.css"/);
    assert.doesNotMatch(res.body, /fonts\.googleapis\.com/);
    assert.doesNotMatch(res.body, /fonts\.gstatic\.com/);
  });

  await t.test("5. Error Page (GET /404-test) links to self-hosted theme and eliminates Google Fonts", async () => {
    const res = await makeRequest("/route-that-does-not-exist", { Accept: "text/html" });
    assert.equal(res.status, 404);
    assert.match(res.body, /href="\/theme\/fonts\.css"/);
    assert.match(res.body, /href="\/theme\/theme\.css"/);
    assert.match(res.body, /href="\/css\/style\.css"/);
    assert.match(res.body, /404 Error/);
    assert.doesNotMatch(res.body, /fonts\.googleapis\.com/);
    assert.doesNotMatch(res.body, /fonts\.gstatic\.com/);
  });

  await t.test("6. Swagger UI (/doc/) loads self-hosted theme and eliminates Google Fonts", async () => {
    const res = await makeRequest("/doc/");
    assert.equal(res.status, 200);
    assert.match(res.body, /\/theme\/fonts\.css/);
    assert.match(res.body, /\/theme\/theme\.css/);
    assert.match(res.body, /\/css\/style\.css/);
    assert.doesNotMatch(res.body, /fonts\.googleapis\.com/);
    assert.doesNotMatch(res.body, /fonts\.gstatic\.com/);
  });

  await t.test("7. Master stylesheet (/css/style.css) imports /theme assets and contains no hardcoded hex tokens in :root", async () => {
    const res = await makeRequest("/css/style.css");
    assert.equal(res.status, 200);
    assert.match(res.body, /@import "\/theme\/fonts\.css";/);
    assert.match(res.body, /@import "\/theme\/theme\.css";/);
    assert.doesNotMatch(res.body, /--color-primary:\s*#[0-9a-fA-F]+/);
    assert.doesNotMatch(res.body, /--color-secondary:\s*#[0-9a-fA-F]+/);
    assert.doesNotMatch(res.body, /--color-background:\s*#[0-9a-fA-F]+/);
  });
});
