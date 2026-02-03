import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "@/lib/auth"
import { ApiError } from "@/lib/api"

const ACCENT = "#b0853c"

export function Login() {
  const navigate = useNavigate()
  const [loginValue, setLoginValue] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(loginValue, password)
      // Небольшая задержка, чтобы сессия успела установиться на сервере
      await new Promise((resolve) => setTimeout(resolve, 200))
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Неверный логин или пароль")
      } else {
        setError("Ошибка входа. Проверьте, что бэкенд запущен.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-svh flex items-center justify-center p-4 md:p-8">
      {/* Фон: картинка + полупрозрачный градиент сверху */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/back.png)" }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-950/92 to-black/95"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-2xl">
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-black/70 shadow-2xl md:flex-row"
        style={{ boxShadow: `0 0 0 1px ${ACCENT}15, 0 25px 50px -12px rgba(0,0,0,0.5)` }}
      >
        {/* Блок с картинкой */}
        <div
          className="flex min-h-[200px] flex-1 items-center justify-center border-b border-neutral-800 bg-neutral-950/80 p-8 md:min-h-0 md:border-b-0 md:border-r"
          style={{ borderColor: `${ACCENT}20` }}
        >
          <img
            src="/image.png"
            alt=""
            className="h-28 w-auto object-contain md:h-36"
          />
        </div>

        {/* Форма */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-center space-y-5 p-8 md:p-10"
        >
          <div>
            <h1 className="text-xl font-semibold text-neutral-100 md:text-2xl">
              Вход
            </h1>
            <div
              className="mt-1 h-0.5 w-12 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login"
              className="block text-sm font-medium text-neutral-400"
            >
              Логин
            </label>
            <input
              id="login"
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-[#b0853c] focus:outline-none focus:ring-2 focus:ring-[#b0853c]/40 disabled:opacity-60"
              placeholder="Логин"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-400"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-neutral-100 placeholder:text-neutral-500 transition-colors focus:border-[#b0853c] focus:outline-none focus:ring-2 focus:ring-[#b0853c]/40 disabled:opacity-60"
              placeholder="Пароль"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-shine mt-2 w-full cursor-pointer rounded-lg py-3 font-medium text-black transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#b0853c] disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: ACCENT,
              boxShadow: `0 0 20px ${ACCENT}30`,
            }}
          >
            <span className="relative z-10">{loading ? "Вход…" : "Войти"}</span>
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
