import "dotenv/config"
import express from "express"
import cors from "cors"
import { connectDb } from "./db.js"
import { getBoard, upsertBoard } from "./models/Board.js"

const app = express()
const port = process.env.PORT ?? 3001
const frontOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"

// Разрешаем несколько origin'ов для разработки и продакшена
const allowedOrigins = [
  frontOrigin,
  "https://omocrm.pro",
  "http://omocrm.pro",
  "https://www.omocrm.pro",
  "http://www.omocrm.pro",
  "http://localhost:5173",
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (например, Postman) или из разрешенных источников
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: false, // Не нужны credentials без куки
  })
)
app.use(express.json())

await connectDb()

// Простая проверка - просто проверяем что запрос пришел (фронтенд контролирует доступ через localStorage)
function requireAuth(req, res, next) {
  // Всегда разрешаем - фронтенд сам контролирует доступ
  return next()
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// POST /api/auth/login — проверка логина/пароля
app.post("/api/auth/login", (req, res) => {
  const { login, password } = req.body || {}
  const expectedLogin = process.env.LOGIN ?? ""
  const expectedPassword = process.env.PASSWORD ?? ""
  if (!login || !password || login !== expectedLogin || password !== expectedPassword) {
    return res.status(401).json({ error: "Неверный логин или пароль" })
  }
  res.json({ ok: true, user: login })
})

// GET /api/auth/me — всегда возвращает OK (проверка на фронтенде через localStorage)
app.get("/api/auth/me", (req, res) => {
  res.json({ ok: true })
})

// POST /api/auth/logout — выход (просто OK, фронтенд сам очистит localStorage)
app.post("/api/auth/logout", (req, res) => {
  res.json({ ok: true })
})

// GET board by projectId (защищён)
app.get("/api/boards/:projectId", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params
    const board = await getBoard(projectId)
    res.json({ cards: board.cards, steps: board.steps })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load board" })
  }
})

// PUT board (защищён)
app.put("/api/boards/:projectId", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params
    const { cards = [], steps = [] } = req.body
    const board = await upsertBoard(projectId, cards, steps)
    res.json({ cards: board.cards, steps: board.steps })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to save board" })
  }
})

app.listen(port, () => {
  console.log(`Server at http://localhost:${port}`)
})
