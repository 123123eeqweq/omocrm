import { useEffect, useState } from "react"
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom"
import { Login } from "@/pages/Login"
import { Dashboard } from "@/pages/Dashboard"
import { ComforTradePage } from "@/pages/dashboard/ComforTradePage"
import { DoviPage } from "@/pages/dashboard/DoviPage"
import { ZavdannyaPage } from "@/pages/dashboard/ZavdannyaPage"
import { isAuthenticated, validateSession, clearAuthenticated, isJustLoggedIn, clearJustLoggedIn } from "@/lib/auth"

function AppRoutes() {
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    // Если только что залогинились, сразу разрешаем доступ без проверки
    if (isJustLoggedIn()) {
      clearJustLoggedIn()
      setSessionChecked(true)
      return
    }

    // Если не залогинены, сразу показываем логин
    if (!isAuthenticated()) {
      setSessionChecked(true)
      return
    }

    // Проверяем сессию в фоне, но не блокируем доступ
    // Если сессия невалидна, пользователь увидит ошибку при попытке использовать API
    validateSession()
      .then((ok) => {
        if (!ok) {
          // Только если сессия точно невалидна, сбрасываем флаг
          clearAuthenticated()
          // Не делаем редирект здесь - пусть пользователь остается на странице
        }
      })
      .catch(() => {
        // При ошибке сети не сбрасываем флаг - возможно просто временная проблема
      })
      .finally(() => setSessionChecked(true))
  }, [])

  if (!sessionChecked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-neutral-950 text-neutral-400">
        Загрузка…
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard/comfortrade" replace />} />
        <Route path="comfortrade" element={<ComforTradePage />} />
        <Route path="dovi" element={<DoviPage />} />
        <Route path="zavdannya-ua" element={<ZavdannyaPage />} />
      </Route>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
