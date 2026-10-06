import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ipGuardMiddleware } from "../core/middleware/ip-guard.middleware.js";
import { corsOptions } from "../core/middleware/cors.middleware.js";
import { env } from "../config/env.js";

describe("Direct IP Guard Middleware", () => {
  test("allows loopback hosts (localhost, 127.0.0.1)", () => {
    let nextCalled = false;
    let receivedError: any = null;

    const req = {
      path: "/api/users",
      headers: { host: "127.0.0.1:5000" },
      hostname: "127.0.0.1",
    } as any;

    const res = {} as any;
    const next = (err?: any) => {
      nextCalled = true;
      receivedError = err;
    };

    ipGuardMiddleware(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(receivedError, undefined);
  });

  test("allows health check endpoint regardless of host", () => {
    let nextCalled = false;
    let receivedError: any = null;

    const req = {
      path: "/api/health",
      headers: { host: "192.168.1.100:5000" },
      hostname: "192.168.1.100",
    } as any;

    const res = {} as any;
    const next = (err?: any) => {
      nextCalled = true;
      receivedError = err;
    };

    ipGuardMiddleware(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(receivedError, undefined);
  });
});

describe("CORS Guard Policy", () => {
  test("allows requests without Origin header (Postman, curl, server-to-server)", () => {
    const originFn = corsOptions.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    let allowed: boolean | undefined;
    let receivedError: Error | null = null;

    originFn(undefined, (err, ok) => {
      receivedError = err;
      allowed = ok;
    });

    assert.equal(receivedError, null);
    assert.equal(allowed, true);
  });

  test("allows requests from configured CLIENT_URL", () => {
    const originFn = corsOptions.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    let allowed: boolean | undefined;
    let receivedError: Error | null = null;

    originFn(env.CLIENT_URL, (err, ok) => {
      receivedError = err;
      allowed = ok;
    });

    assert.equal(receivedError, null);
    assert.equal(allowed, true);
  });

  test("strictly blocks requests from unauthorized browser origins with 403 error", () => {
    const originFn = corsOptions.origin as (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void;

    let receivedError: any = null;

    originFn("https://malicious-website.com", (err) => {
      receivedError = err;
    });

    assert.ok(receivedError);
    assert.equal(receivedError.statusCode, 403);
    assert.match(receivedError.message, /Access blocked: Origin .* is not authorized/);
  });
});

