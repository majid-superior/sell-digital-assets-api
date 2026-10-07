import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { companyRepository } from "../database/repositories/company.repository.js";
import { pool } from "../config/database.js";
import { defaultCompany, defaultCurrency, TOP_CURRENCIES } from "../data/company.js";

describe("Currencies Table & Company Currency Relation", () => {
  after(async () => {
    await pool.end();
  });

  test("defaultCompany has defaultCurrency set to Pakistan (PKR)", () => {
    assert.equal(defaultCurrency.code, "PKR");
    assert.equal(defaultCurrency.name, "Pakistani Rupee");
    assert.equal(defaultCurrency.symbol, "₨");
    assert.equal(defaultCompany.defaultCurrency, "PKR");
    assert.deepEqual(defaultCompany.currency, defaultCurrency);
  });

  test("TOP_CURRENCIES contains 10 currencies including Pakistan", () => {
    assert.equal(TOP_CURRENCIES.length, 10);
    const pkr = TOP_CURRENCIES.find((c) => c.code === "PKR");
    assert.ok(pkr);
    assert.equal(pkr.name, "Pakistani Rupee");
  });

  test("companyRepository.getCompany returns company with joined currency relation", async () => {
    const company = await companyRepository.getCompany();
    assert.ok(company);
    assert.equal(company.default_currency, "PKR");
    assert.ok(company.currency);
    assert.equal((company.currency as any).code, "PKR");
    assert.equal((company.currency as any).name, "Pakistani Rupee");
    assert.equal((company.currency as any).symbol, "₨");
  });
});

