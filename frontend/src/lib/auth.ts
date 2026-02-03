import { loginApi } from "@/lib/api"

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

/** Логин через API - проверяет логин/пароль и сохраняет в localStorage */
export async function login(login: string, password: string): Promise<void> {
  await loginApi(login, password)
  setAuthenticated()
}

/** Выход - просто очищает localStorage */
export async function logout(): Promise<void> {
  clearAuthenticated()
}
