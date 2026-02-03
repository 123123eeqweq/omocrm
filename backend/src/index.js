import "dotenv/config"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import session from "express-session"
import { connectDb } from "./db.js"
import { getBoard, upsertBoard } from "./models/Board.js"

const app = express()
const port = process.env.PORT ?? 3001
const frontOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173"

app.use(
  cors({
    origin: frontOrigin,
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json())
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    },
  })
)

await connectDb()

function requireAuth(req, res, next) {
  if (req.session?.userId) return next()
  res.status(401).json({ error: "Unauthorized" })
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

// POST /api/auth/login — проверка логина/пароля, создание сессии
app.post("/api/auth/login", (req, res) => {
  const { login, password } = req.body || {}
  const expectedLogin = process.env.LOGIN ?? ""
  const expectedPassword = process.env.PASSWORD ?? ""
  if (!login || !password || login !== expectedLogin || password !== expectedPassword) {
    return res.status(401).json({ error: "Неверный логин или пароль" })
  }
  req.session.userId = login
  req.session.save((err) => {
    if (err) return res.status(500).json({ error: "Session error" })
    res.json({ ok: true })
  })
})

// GET /api/auth/me — проверка сессии (не нужно логиниться каждый раз)
app.get("/api/auth/me", (req, res) => {
  if (req.session?.userId) return res.json({ user: req.session.userId })
  res.status(401).json({ error: "Unauthorized" })
})

// POST /api/auth/logout — выход
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout error" })
    res.clearCookie("connect.sid")
    res.json({ ok: true })
  })
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
