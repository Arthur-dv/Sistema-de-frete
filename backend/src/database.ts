import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL não definido. Crie `backend/.env` com DATABASE_URL ou inicie o servidor a partir da pasta `backend`.'
    );
  }
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

export async function initDatabase(): Promise<void> {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'driver' CHECK(role IN ('admin', 'driver')),
      placa TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      placa TEXT NOT NULL,
      data TEXT NOT NULL,
      cte_rodeiro TEXT NOT NULL DEFAULT '',
      empresa_origem TEXT NOT NULL DEFAULT '',
      empresa_destino TEXT NOT NULL DEFAULT '',
      vr_frete_peso REAL NOT NULL DEFAULT 0,
      data_recbto TEXT,
      recebido_por TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS fuel_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      placa TEXT NOT NULL,
      data TEXT NOT NULL,
      nome_posto TEXT NOT NULL DEFAULT '',
      km REAL NOT NULL DEFAULT 0,
      litros REAL NOT NULL DEFAULT 0,
      valor_abastecido REAL NOT NULL DEFAULT 0,
      recebido_por TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function queryAll(sql: string, params: unknown[] = []): Promise<any[]> {
  const result = await getPool().query(sql, params);
  return result.rows;
}

export async function queryOne(sql: string, params: unknown[] = []): Promise<any | null> {
  const result = await getPool().query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function runSql(sql: string, params: unknown[] = []): Promise<void> {
  await getPool().query(sql, params);
}
