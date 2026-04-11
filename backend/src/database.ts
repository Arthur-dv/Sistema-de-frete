import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data.db');

let db: SqlJsDatabase;

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  let buffer: Buffer | undefined;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
  }

  db = buffer ? new SQL.Database(buffer) : new SQL.Database();

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'driver' CHECK(role IN ('admin', 'driver')),
      placa TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      placa TEXT NOT NULL,
      data TEXT NOT NULL,
      cte_rodeiro TEXT NOT NULL DEFAULT '',
      empresa_origem TEXT NOT NULL DEFAULT '',
      empresa_destino TEXT NOT NULL DEFAULT '',
      vr_frete_peso REAL NOT NULL DEFAULT 0,
      data_recbto TEXT,
      recebido_por TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fuel_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      placa TEXT NOT NULL,
      data TEXT NOT NULL,
      nome_posto TEXT NOT NULL DEFAULT '',
      km REAL NOT NULL DEFAULT 0,
      litros REAL NOT NULL DEFAULT 0,
      valor_abastecido REAL NOT NULL DEFAULT 0,
      recebido_por TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  saveDatabase();
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function runSql(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDatabase();
}

export function getLastInsertId(): number {
  const row = queryOne('SELECT last_insert_rowid() as id');
  return row?.id ?? 0;
}
