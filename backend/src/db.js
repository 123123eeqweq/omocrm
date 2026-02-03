import pg from "pg"

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function connectDb() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        project_id TEXT PRIMARY KEY,
        cards JSONB DEFAULT '[]',
        steps JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log("PostgreSQL connected")
  } finally {
    client.release()
  }
}
