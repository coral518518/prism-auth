import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { isProtected } from "../worker/routes/admin-kv";
import {
  getConfig,
  setConfigValue,
  getJwtSecret,
  invalidateConfigCache,
  invalidateJwtSecretCache,
} from "../worker/lib/config";
import { getMLDSAKey, invalidateMLDSAKeyCache } from "../worker/lib/mldsa";

class MockD1Statement {
  private values: unknown[] = [];

  constructor(
    private readonly db: Database,
    private readonly sql: string,
    private readonly onQuery?: () => void,
  ) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async run() {
    this.onQuery?.();
    this.db.query(this.sql).all(...this.values);
    return { success: true, meta: { changes: 1 } };
  }

  async all<T>() {
    this.onQuery?.();
    const results = this.db.query(this.sql).all(...this.values) as T[];
    return { success: true, results };
  }

  async first<T>() {
    this.onQuery?.();
    return (this.db.query(this.sql).get(...this.values) as T | null) ?? null;
  }
}

class MockD1 {
  public queryCount = 0;
  constructor(private readonly db: Database) {}

  prepare(sql: string) {
    return new MockD1Statement(this.db, sql, () => {
      this.queryCount++;
    });
  }

  async batch(stmts: unknown[]) {
    this.queryCount += stmts.length;
    return [];
  }
}

class MockKV {
  public store = new Map<string, string>();
  public getCount = 0;
  public putCount = 0;

  async get(key: string) {
    this.getCount++;
    return this.store.get(key) ?? null;
  }

  async put(key: string, val: string) {
    this.putCount++;
    this.store.set(key, val);
  }
}

describe("Free Tier Optimizations & Security Fixes", () => {
  test("KV Console protects post-quantum seed key", () => {
    expect(isProtected("system:ml_dsa65_v1_seed")).toBe(true);
    expect(isProtected("system:jwt_secret")).toBe(true);
    expect(isProtected("system:rsa_keypair")).toBe(true);
    expect(isProtected("random:key")).toBe(false);
  });

  test("getConfig caches in memory and invalidates on update", async () => {
    invalidateConfigCache();
    const rawDb = new Database(":memory:");
    rawDb.run(
      "CREATE TABLE site_config (key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER)",
    );
    rawDb.run(
      "INSERT INTO site_config (key, value, updated_at) VALUES ('site_name', '\"Test Site\"', 1000)",
    );

    const d1 = new MockD1(rawDb);

    // First call reads from D1
    const config1 = await getConfig(d1 as unknown as D1Database);
    expect(config1.site_name).toBe("Test Site");
    expect(d1.queryCount).toBe(1);

    // Second call hits in-memory cache, no new D1 query
    const config2 = await getConfig(d1 as unknown as D1Database);
    expect(config2.site_name).toBe("Test Site");
    expect(d1.queryCount).toBe(1);

    // Updating a config value invalidates the cache
    await setConfigValue(
      d1 as unknown as D1Database,
      "site_name",
      "Updated Site",
    );
    // setConfigValue executes an insert query
    expect(d1.queryCount).toBe(2);

    // Next call reads updated value from D1
    const config3 = await getConfig(d1 as unknown as D1Database);
    expect(config3.site_name).toBe("Updated Site");
    expect(d1.queryCount).toBe(3);
  });

  test("getJwtSecret caches in memory and avoids repeated KV reads", async () => {
    invalidateJwtSecretCache();
    const kv = new MockKV();
    kv.store.set("system:jwt_secret", "test_jwt_secret_value_12345");

    const secret1 = await getJwtSecret(kv as unknown as KVNamespace);
    expect(secret1).toBe("test_jwt_secret_value_12345");
    expect(kv.getCount).toBe(1);

    // Repeated call hits in-memory cache, no KV read
    const secret2 = await getJwtSecret(kv as unknown as KVNamespace);
    expect(secret2).toBe("test_jwt_secret_value_12345");
    expect(kv.getCount).toBe(1);
  });

  test("getMLDSAKey caches derived post-quantum keys in memory", async () => {
    invalidateMLDSAKeyCache();
    const kv = new MockKV();

    const key1 = await getMLDSAKey(kv as unknown as KVNamespace);
    expect(key1.publicKey).toBeDefined();
    expect(key1.secretKey).toBeDefined();
    expect(key1.kid).toBeDefined();
    expect(kv.getCount).toBe(1); // Read existing (null)
    expect(kv.putCount).toBe(1); // Stored newly generated seed

    // Second call hits in-memory cache, avoiding both KV read and expensive keygen derivation
    const key2 = await getMLDSAKey(kv as unknown as KVNamespace);
    expect(key2.kid).toBe(key1.kid);
    expect(kv.getCount).toBe(1);
    expect(kv.putCount).toBe(1);
  });
});
