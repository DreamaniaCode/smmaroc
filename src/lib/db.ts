import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const sqlite = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER', -- ADMIN | OPERATOR | USER
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'MAD',
    apiKey TEXT UNIQUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    apiUrl TEXT NOT NULL,
    apiKey TEXT NOT NULL,
    balance REAL DEFAULT 0.0,
    currency TEXT DEFAULT 'USD',
    lowBalanceLimit REAL DEFAULT 20.0,
    isActive INTEGER DEFAULT 1,
    lastCheckedAt TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    minQuantity INTEGER DEFAULT 10,
    maxQuantity INTEGER DEFAULT 100000,
    ratePer1000 REAL DEFAULT 0.0,        -- Wholesale cost per 1k ($)
    sellingRatePer1000 REAL DEFAULT 0.0, -- Retail selling price per 1k (MAD/$)
    dripFeedAllowed INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS service_mappings (
    id TEXT PRIMARY KEY,
    serviceId TEXT UNIQUE NOT NULL,
    primaryProviderId TEXT NOT NULL,
    primaryServiceId TEXT NOT NULL,
    backupProviderId TEXT,
    backupServiceId TEXT,
    autoFailover INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (primaryProviderId) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (backupProviderId) REFERENCES providers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT,                        -- Customer who placed the order
    clientId TEXT,                      -- Agency client tag (optional)
    serviceId TEXT NOT NULL,
    link TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    runs INTEGER DEFAULT 1,
    intervalMinutes INTEGER DEFAULT 0,
    completedRuns INTEGER DEFAULT 0,
    currentProviderId TEXT,
    providerOrderId TEXT,
    status TEXT DEFAULT 'PENDING',
    startCount INTEGER,
    remains INTEGER,
    charge REAL DEFAULT 0.0,            -- Wholesale charge from provider ($)
    customerCost REAL DEFAULT 0.0,      -- Retail charge deducted from customer wallet (MAD)
    failoverAttempted INTEGER DEFAULT 0,
    failoverReason TEXT,
    source TEXT DEFAULT 'MANUAL',       -- MANUAL | MASS | CSV | API | GOOGLE_SHEETS
    sheetRowIndex INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (currentProviderId) REFERENCES providers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'MAD',
    method TEXT NOT NULL,               -- CIH_BANK | ATTIJARIWAFA | CASH_PLUS | USDT_TRC20 | STRIPE
    reference TEXT,                     -- Bank transfer receipt / transaction ID
    status TEXT DEFAULT 'PENDING',      -- PENDING | APPROVED | REJECTED
    adminNotes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Safe migration check: add columns if table existed without them
try {
  sqlite.exec("ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0.0;");
} catch {}
try {
  sqlite.exec("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'MAD';");
} catch {}
try {
  sqlite.exec("ALTER TABLE users ADD COLUMN apiKey TEXT;");
} catch {}
try {
  sqlite.exec("ALTER TABLE services ADD COLUMN sellingRatePer1000 REAL DEFAULT 0.0;");
} catch {}
try {
  sqlite.exec("ALTER TABLE orders ADD COLUMN userId TEXT;");
} catch {}
try {
  sqlite.exec("ALTER TABLE orders ADD COLUMN customerCost REAL DEFAULT 0.0;");
} catch {}

export const db = {
  user: {
    async findUnique({ where }: { where: { email?: string; id?: string; apiKey?: string } }) {
      if (where.email) {
        const stmt = sqlite.prepare("SELECT * FROM users WHERE lower(email) = lower(?)");
        const row = stmt.get(where.email) as any;
        return row || null;
      }
      if (where.id) {
        const stmt = sqlite.prepare("SELECT * FROM users WHERE id = ?");
        const row = stmt.get(where.id) as any;
        return row || null;
      }
      if (where.apiKey) {
        const stmt = sqlite.prepare("SELECT * FROM users WHERE apiKey = ?");
        const row = stmt.get(where.apiKey) as any;
        return row || null;
      }
      return null;
    },
    async findMany({ where, orderBy }: any = {}) {
      let query = "SELECT * FROM users";
      if (where?.role) {
        query += ` WHERE role = '${where.role}'`;
      }
      query += " ORDER BY createdAt DESC";
      return sqlite.prepare(query).all() as any[];
    },
    async count({ where }: any = {}) {
      let query = "SELECT COUNT(*) as count FROM users";
      if (where?.role) {
        query += ` WHERE role = '${where.role}'`;
      }
      const stmt = sqlite.prepare(query);
      const res = stmt.get() as any;
      return Number(res?.count || 0);
    },
    async create({ data }: { data: any }) {
      const id = data.id || crypto.randomUUID();
      const apiKey = data.apiKey || `smm_live_${crypto.randomBytes(16).toString("hex")}`;
      const now = new Date().toISOString();
      const stmt = sqlite.prepare(`
        INSERT INTO users (id, email, name, passwordHash, role, balance, currency, apiKey, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        data.email.toLowerCase(),
        data.name,
        data.passwordHash,
        data.role || "USER",
        data.balance || 0.0,
        data.currency || "MAD",
        apiKey,
        now,
        now
      );
      return {
        id,
        email: data.email,
        name: data.name,
        role: data.role || "USER",
        balance: data.balance || 0.0,
        currency: data.currency || "MAD",
        apiKey,
        createdAt: now,
        updatedAt: now,
      };
    },
    async update({ where, data }: { where: { id?: string; email?: string }; data: any }) {
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: any[] = [];
      for (const [k, v] of Object.entries(data)) {
        sets.push(`${k} = ?`);
        values.push(v);
      }
      sets.push("updatedAt = ?");
      values.push(now);

      const targetCol = where.id ? "id" : "email";
      const targetVal = where.id ? where.id : where.email?.toLowerCase();
      values.push(targetVal);

      sqlite.prepare(`UPDATE users SET ${sets.join(", ")} WHERE ${targetCol} = ?`).run(...values);
      return this.findUnique({ where });
    },
  },

  deposit: {
    async findMany({ where, orderBy, take }: any = {}) {
      let query = "SELECT d.*, u.name as userName, u.email as userEmail FROM deposits d LEFT JOIN users u ON d.userId = u.id";
      const conditions: string[] = [];
      const params: any[] = [];

      if (where?.userId) {
        conditions.push("d.userId = ?");
        params.push(where.userId);
      }
      if (where?.status) {
        conditions.push("d.status = ?");
        params.push(where.status);
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
      query += " ORDER BY d.createdAt DESC";
      if (take) {
        query += ` LIMIT ${Number(take)}`;
      }

      const rows = sqlite.prepare(query).all(...params) as any[];
      return rows.map((r) => ({
        ...r,
        user: { name: r.userName, email: r.userEmail },
      }));
    },
    async findUnique({ where }: { where: { id: string } }) {
      const query = "SELECT d.*, u.name as userName, u.email as userEmail FROM deposits d LEFT JOIN users u ON d.userId = u.id WHERE d.id = ?";
      const r = sqlite.prepare(query).get(where.id) as any;
      if (!r) return null;
      return {
        ...r,
        user: { name: r.userName, email: r.userEmail },
      };
    },
    async create({ data }: { data: any }) {
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      sqlite.prepare(`
        INSERT INTO deposits (id, userId, amount, currency, method, reference, status, adminNotes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.userId,
        data.amount,
        data.currency || "MAD",
        data.method,
        data.reference || null,
        data.status || "PENDING",
        data.adminNotes || null,
        now,
        now
      );
      return this.findUnique({ where: { id } });
    },
    async update({ where, data }: { where: { id: string }; data: any }) {
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: any[] = [];
      for (const [k, v] of Object.entries(data)) {
        sets.push(`${k} = ?`);
        values.push(v);
      }
      sets.push("updatedAt = ?");
      values.push(now);
      values.push(where.id);

      sqlite.prepare(`UPDATE deposits SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return this.findUnique({ where });
    },
    async count({ where }: any = {}) {
      let query = "SELECT COUNT(*) as count FROM deposits";
      if (where?.status) {
        query += ` WHERE status = '${where.status}'`;
      }
      const res = sqlite.prepare(query).get() as any;
      return Number(res?.count || 0);
    },
  },

  client: {
    async findMany({ orderBy, include }: any = {}) {
      const rows = sqlite.prepare("SELECT * FROM clients ORDER BY name ASC").all() as any[];
      return rows.map((c) => {
        const orderCount = sqlite.prepare("SELECT COUNT(*) as count FROM orders WHERE clientId = ?").get(c.id) as any;
        return {
          ...c,
          _count: { orders: Number(orderCount?.count || 0) },
        };
      });
    },
    async create({ data }: { data: any }) {
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      sqlite.prepare("INSERT INTO clients (id, name, email, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, data.name, data.email || null, data.notes || null, now, now);
      return { id, name: data.name, email: data.email, notes: data.notes, createdAt: now, updatedAt: now };
    },
    async upsert({ where, create, update }: any) {
      const existing = sqlite.prepare("SELECT * FROM clients WHERE name = ?").get(where.name) as any;
      if (existing) return existing;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      sqlite.prepare("INSERT INTO clients (id, name, email, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, create.name, create.email || null, create.notes || null, now, now);
      return { id, ...create, createdAt: now, updatedAt: now };
    },
    async count() {
      const res = sqlite.prepare("SELECT COUNT(*) as count FROM clients").get() as any;
      return Number(res?.count || 0);
    },
  },

  provider: {
    async findMany({ where, include }: any = {}) {
      let query = "SELECT * FROM providers";
      if (where?.isActive !== undefined) {
        query += ` WHERE isActive = ${where.isActive ? 1 : 0}`;
      }
      query += " ORDER BY createdAt DESC";
      const rows = sqlite.prepare(query).all() as any[];
      return rows.map((p) => {
        const orderCount = sqlite.prepare("SELECT COUNT(*) as count FROM orders WHERE currentProviderId = ?").get(p.id) as any;
        return {
          ...p,
          isActive: Boolean(p.isActive),
          _count: { orders: Number(orderCount?.count || 0) },
        };
      });
    },
    async findUnique({ where }: { where: { id: string } }) {
      const p = sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(where.id) as any;
      if (!p) return null;
      return { ...p, isActive: Boolean(p.isActive) };
    },
    async create({ data }: { data: any }) {
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      sqlite.prepare(`
        INSERT INTO providers (id, name, apiUrl, apiKey, balance, currency, lowBalanceLimit, isActive, lastCheckedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name,
        data.apiUrl,
        data.apiKey,
        data.balance || 0.0,
        data.currency || "USD",
        data.lowBalanceLimit || 20.0,
        data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
        now,
        now,
        now
      );
      return { id, ...data, createdAt: now, updatedAt: now };
    },
    async update({ where, data }: { where: { id: string }; data: any }) {
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: any[] = [];
      for (const [k, v] of Object.entries(data)) {
        sets.push(`${k} = ?`);
        if (typeof v === "boolean") values.push(v ? 1 : 0);
        else if (v instanceof Date) values.push(v.toISOString());
        else values.push(v);
      }
      sets.push("updatedAt = ?");
      values.push(now);
      values.push(where.id);

      sqlite.prepare(`UPDATE providers SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return this.findUnique({ where });
    },
  },

  service: {
    async findMany({ include }: any = {}) {
      const rows = sqlite.prepare("SELECT * FROM services ORDER BY category ASC, name ASC").all() as any[];
      return rows.map((s) => {
        let mapping: any = null;
        const mapRow = sqlite.prepare("SELECT * FROM service_mappings WHERE serviceId = ?").get(s.id) as any;
        if (mapRow) {
          const primaryProvider = sqlite.prepare("SELECT id, name, balance, currency FROM providers WHERE id = ?").get(mapRow.primaryProviderId) as any;
          const backupProvider = mapRow.backupProviderId ? sqlite.prepare("SELECT id, name, balance, currency FROM providers WHERE id = ?").get(mapRow.backupProviderId) as any : null;
          mapping = {
            ...mapRow,
            autoFailover: Boolean(mapRow.autoFailover),
            primaryProvider,
            backupProvider,
          };
        }
        const sellingRate = s.sellingRatePer1000 && s.sellingRatePer1000 > 0 ? s.sellingRatePer1000 : (s.ratePer1000 * 1.5 * 10); // default retail in MAD
        return {
          ...s,
          sellingRatePer1000: sellingRate,
          dripFeedAllowed: Boolean(s.dripFeedAllowed),
          mapping,
        };
      });
    },
    async findUnique({ where, include }: any) {
      const s = sqlite.prepare("SELECT * FROM services WHERE id = ?").get(where.id) as any;
      if (!s) return null;
      let mapping: any = null;
      const mapRow = sqlite.prepare("SELECT * FROM service_mappings WHERE serviceId = ?").get(s.id) as any;
      if (mapRow) {
        const primaryProvider = sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(mapRow.primaryProviderId) as any;
        const backupProvider = mapRow.backupProviderId ? sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(mapRow.backupProviderId) as any : null;
        mapping = {
          ...mapRow,
          autoFailover: Boolean(mapRow.autoFailover),
          primaryProvider,
          backupProvider,
        };
      }
      const sellingRate = s.sellingRatePer1000 && s.sellingRatePer1000 > 0 ? s.sellingRatePer1000 : (s.ratePer1000 * 1.5 * 10);
      return { ...s, sellingRatePer1000: sellingRate, dripFeedAllowed: Boolean(s.dripFeedAllowed), mapping };
    },
    async findFirst({ where, include }: any) {
      let query = "SELECT * FROM services";
      const params: any[] = [];
      if (where?.OR) {
        const ors = where.OR.map((condition: any) => {
          if (condition.id) {
            params.push(condition.id);
            return "id = ?";
          }
          if (condition.name?.contains) {
            params.push(`%${condition.name.contains}%`);
            return "name LIKE ?";
          }
          return "1=1";
        });
        query += ` WHERE (${ors.join(" OR ")})`;
      }
      query += " LIMIT 1";
      const s = sqlite.prepare(query).get(...params) as any;
      if (!s) return null;
      return this.findUnique({ where: { id: s.id }, include });
    },
    async create({ data, include }: any) {
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      const sellingRate = data.sellingRatePer1000 || (data.ratePer1000 ? data.ratePer1000 * 1.5 * 10 : 25.0);
      sqlite.prepare(`
        INSERT INTO services (id, name, category, minQuantity, maxQuantity, ratePer1000, sellingRatePer1000, dripFeedAllowed, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name,
        data.category,
        data.minQuantity || 10,
        data.maxQuantity || 100000,
        data.ratePer1000 || 0.0,
        sellingRate,
        data.dripFeedAllowed ? 1 : 0,
        now,
        now
      );

      if (data.mapping?.create) {
        const m = data.mapping.create;
        const mapId = crypto.randomUUID();
        sqlite.prepare(`
          INSERT INTO service_mappings (id, serviceId, primaryProviderId, primaryServiceId, backupProviderId, backupServiceId, autoFailover, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          mapId,
          id,
          m.primaryProviderId,
          m.primaryServiceId,
          m.backupProviderId || null,
          m.backupServiceId || null,
          m.autoFailover !== undefined ? (m.autoFailover ? 1 : 0) : 1,
          now,
          now
        );
      }

      return this.findUnique({ where: { id }, include });
    },
    async update({ where, data }: { where: { id: string }; data: any }) {
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: any[] = [];
      for (const [k, v] of Object.entries(data)) {
        sets.push(`${k} = ?`);
        if (typeof v === "boolean") values.push(v ? 1 : 0);
        else values.push(v);
      }
      sets.push("updatedAt = ?");
      values.push(now);
      values.push(where.id);

      sqlite.prepare(`UPDATE services SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return this.findUnique({ where });
    },
  },

  order: {
    async findMany({ where, orderBy, take, include }: any = {}) {
      let query = "SELECT * FROM orders";
      const conditions: string[] = [];
      const params: any[] = [];

      if (where?.userId) {
        conditions.push("userId = ?");
        params.push(where.userId);
      }

      if (where?.status) {
        if (typeof where.status === "string") {
          conditions.push("status = ?");
          params.push(where.status);
        } else if (where.status.in) {
          const placeholders = where.status.in.map(() => "?").join(",");
          conditions.push(`status IN (${placeholders})`);
          params.push(...where.status.in);
        }
      }

      if (where?.clientId) {
        conditions.push("clientId = ?");
        params.push(where.clientId);
      }

      if (where?.providerOrderId?.not !== undefined) {
        conditions.push("providerOrderId IS NOT NULL");
      }

      if (where?.currentProviderId?.not !== undefined) {
        conditions.push("currentProviderId IS NOT NULL");
      }

      if (where?.OR) {
        const orClauses = where.OR.map((cond: any) => {
          if (cond.link?.contains) {
            params.push(`%${cond.link.contains}%`);
            return "link LIKE ?";
          }
          if (cond.id?.contains) {
            params.push(`%${cond.id.contains}%`);
            return "id LIKE ?";
          }
          if (cond.providerOrderId?.contains) {
            params.push(`%${cond.providerOrderId.contains}%`);
            return "providerOrderId LIKE ?";
          }
          return "1=1";
        });
        conditions.push(`(${orClauses.join(" OR ")})`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += " ORDER BY createdAt DESC";
      if (take) {
        query += ` LIMIT ${Number(take)}`;
      }

      const rows = sqlite.prepare(query).all(...params) as any[];
      return rows.map((o) => {
        const user = o.userId ? sqlite.prepare("SELECT id, name, email FROM users WHERE id = ?").get(o.userId) as any : null;
        const client = o.clientId ? sqlite.prepare("SELECT id, name FROM clients WHERE id = ?").get(o.clientId) as any : null;
        const service = sqlite.prepare("SELECT id, name, category FROM services WHERE id = ?").get(o.serviceId) as any;
        const currentProvider = o.currentProviderId ? sqlite.prepare("SELECT id, name FROM providers WHERE id = ?").get(o.currentProviderId) as any : null;
        return {
          ...o,
          failoverAttempted: Boolean(o.failoverAttempted),
          user,
          client,
          service,
          currentProvider,
        };
      });
    },

    async findUnique({ where, include }: any) {
      const o = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(where.id) as any;
      if (!o) return null;

      const user = o.userId ? sqlite.prepare("SELECT id, name, email FROM users WHERE id = ?").get(o.userId) as any : null;
      const client = o.clientId ? sqlite.prepare("SELECT * FROM clients WHERE id = ?").get(o.clientId) as any : null;
      let service: any = null;
      if (o.serviceId) {
        service = sqlite.prepare("SELECT * FROM services WHERE id = ?").get(o.serviceId) as any;
        if (service && include?.service?.include?.mapping) {
          const mapRow = sqlite.prepare("SELECT * FROM service_mappings WHERE serviceId = ?").get(service.id) as any;
          if (mapRow) {
            const primaryProvider = sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(mapRow.primaryProviderId) as any;
            const backupProvider = mapRow.backupProviderId ? sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(mapRow.backupProviderId) as any : null;
            service.mapping = {
              ...mapRow,
              autoFailover: Boolean(mapRow.autoFailover),
              primaryProvider,
              backupProvider,
            };
          }
        }
      }
      const currentProvider = o.currentProviderId ? sqlite.prepare("SELECT * FROM providers WHERE id = ?").get(o.currentProviderId) as any : null;

      return {
        ...o,
        failoverAttempted: Boolean(o.failoverAttempted),
        user,
        client,
        service,
        currentProvider,
      };
    },

    async create({ data, include }: any) {
      const id = data.id || crypto.randomUUID();
      const now = new Date().toISOString();
      sqlite.prepare(`
        INSERT INTO orders (
          id, userId, clientId, serviceId, link, quantity, runs, intervalMinutes, completedRuns,
          currentProviderId, providerOrderId, status, startCount, remains, charge, customerCost,
          failoverAttempted, failoverReason, source, sheetRowIndex, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.userId || null,
        data.clientId || null,
        data.serviceId,
        data.link,
        data.quantity,
        data.runs || 1,
        data.intervalMinutes || 0,
        data.completedRuns || 0,
        data.currentProviderId || null,
        data.providerOrderId || null,
        data.status || "PENDING",
        data.startCount || null,
        data.remains || null,
        data.charge || 0.0,
        data.customerCost || 0.0,
        data.failoverAttempted ? 1 : 0,
        data.failoverReason || null,
        data.source || "MANUAL",
        data.sheetRowIndex || null,
        now,
        now
      );

      return this.findUnique({ where: { id }, include });
    },

    async update({ where, data }: { where: { id: string }; data: any }) {
      const now = new Date().toISOString();
      const sets: string[] = [];
      const values: any[] = [];
      for (const [k, v] of Object.entries(data)) {
        sets.push(`${k} = ?`);
        if (typeof v === "boolean") values.push(v ? 1 : 0);
        else values.push(v);
      }
      sets.push("updatedAt = ?");
      values.push(now);
      values.push(where.id);

      sqlite.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...values);
      return this.findUnique({ where });
    },

    async count({ where }: any = {}) {
      let query = "SELECT COUNT(*) as count FROM orders";
      const conditions: string[] = [];
      const params: any[] = [];

      if (where?.userId) {
        conditions.push("userId = ?");
        params.push(where.userId);
      }
      if (where?.status) {
        if (typeof where.status === "string") {
          conditions.push("status = ?");
          params.push(where.status);
        } else if (where.status.in) {
          const placeholders = where.status.in.map(() => "?").join(",");
          conditions.push(`status IN (${placeholders})`);
          params.push(...where.status.in);
        }
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      const res = sqlite.prepare(query).get(...params) as any;
      return Number(res?.count || 0);
    },

    async aggregate({ where, _sum }: any) {
      let query = "SELECT SUM(charge) as totalCharge, SUM(customerCost) as totalRevenue FROM orders";
      const res = sqlite.prepare(query).get() as any;
      return {
        _sum: {
          charge: Number(res?.totalCharge || 0),
          customerCost: Number(res?.totalRevenue || 0),
        },
      };
    },
  },

  appSetting: {
    async findMany() {
      return sqlite.prepare("SELECT * FROM app_settings").all() as any[];
    },
    async findUnique({ where }: { where: { key: string } }) {
      const row = sqlite.prepare("SELECT * FROM app_settings WHERE key = ?").get(where.key) as any;
      return row || null;
    },
    async upsert({ where, update, create }: any) {
      const now = new Date().toISOString();
      sqlite.prepare(`
        INSERT INTO app_settings (key, value, updatedAt) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
      `).run(where.key, update.value, now);
      return { key: where.key, value: update.value, updatedAt: now };
    },
  },
};
