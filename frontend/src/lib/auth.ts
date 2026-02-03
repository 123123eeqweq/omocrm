import { checkSession, loginApi, logoutApi } from "@/lib/api"

const AUTH_KEY = "auth"

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "1"
}

export function setAuthenticated(): void {
  localStorage.setItem(AUTH_KEY, "1")
}

export function clearAuthenticated(): void {
  localStorage.removeItem(AUTH_KEY)
}

/** Логин через API (создаёт сессию на бэкенде). Не нужно логиниться каждый раз — сессия живёт ~7 дней. */
export async function login(login: string, password: string): Promise<void> {
  await loginApi(login, password)
  setAuthenticated()
}

/** Выход: убивает сессию на бэкенде и сбрасывает флаг на фронте. */
export async function logout(): Promise<void> {
  try {
    await logoutApi()
  } finally {
    clearAuthenticated()
  }
}

/** Проверить, жива ли сессия на бэкенде (при загрузке приложения). */
export async function validateSession(): Promise<boolean> {
  const ok = await checkSession()
  if (!ok) clearAuthenticated()
  return ok
}
