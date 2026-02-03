const API_BASE = import.meta.env.VITE_API_URL ?? ""

const defaultCredentials: RequestCredentials = "include"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export type CardItem = { id: string; columnId: string; title: string }
export type StepItem = { id: string; title: string; completed?: boolean }

async function checkResponse(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || "Request failed", res.status)
  }
}

export async function getBoard(projectId: string): Promise<{ cards: CardItem[]; steps: StepItem[] }> {
  const res = await fetch(`${API_BASE}/api/boards/${encodeURIComponent(projectId)}`, {
    credentials: defaultCredentials,
  })
  await checkResponse(res)
  const data = await res.json()
  return { cards: data.cards ?? [], steps: data.steps ?? [] }
}

export async function saveBoard(
  projectId: string,
  cards: CardItem[],
  steps: StepItem[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/boards/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    credentials: defaultCredentials,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards, steps }),
  })
  await checkResponse(res)
}

export async function loginApi(login: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    credentials: defaultCredentials,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  })
  await checkResponse(res)
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: defaultCredentials,
  })
  if (!res.ok) return // уже разлогинен
  await checkResponse(res)
}

export async function checkSession(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: defaultCredentials })
  return res.ok
}
