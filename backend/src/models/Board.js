import { pool } from "../db.js"

export async function getBoard(projectId) {
  const { rows } = await pool.query(
    "SELECT cards, steps FROM boards WHERE project_id = $1",
    [projectId]
  )
  if (!rows.length) return { cards: [], steps: [] }
  return {
    cards: rows[0].cards || [],
    steps: rows[0].steps || [],
  }
}

export async function upsertBoard(projectId, cards, steps) {
  const { rows } = await pool.query(
    `INSERT INTO boards (project_id, cards, steps, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, NOW())
     ON CONFLICT (project_id) DO UPDATE SET
       cards = $2::jsonb,
       steps = $3::jsonb,
       updated_at = NOW()
     RETURNING cards, steps`,
    [projectId, JSON.stringify(cards), JSON.stringify(steps)]
  )
  return rows[0]
}
