import { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { logout } from "@/lib/auth"

const ACCENT = "#b0853c"

const COMPANY_ITEMS = [
  { to: "/dashboard/comfortrade", label: "ComforTrade", image: "/comfortrade.png" },
  { to: "/dashboard/dovi", label: "Dovi", image: "/dovi.jpg" },
  { to: "/dashboard/zavdannya-ua", label: "Завдання", image: "/tasks.png" },
] as const

const TODO_ITEM = { to: "/dashboard/todo", label: "To Do", image: null } as const

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => setSidebarOpen(false), [location.pathname])

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative flex min-h-svh md:h-svh">
      {/* Фон */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/back.png)" }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-950/92 to-black/95"
        aria-hidden
      />

      {/* Мобильный хедер */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-800 bg-black/90 px-4 md:hidden" style={{ boxShadow: `0 1px 0 0 ${ACCENT}15` }}>
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {sidebarOpen ? <IconClose /> : <IconMenu />}
        </button>
        <Link to="/dashboard" className="flex items-center" onClick={() => setSidebarOpen(false)}>
          <img src="/image.png" alt="" className="h-8 w-auto object-contain" />
        </Link>
      </header>

      {/* Оверлей при открытом меню */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-10 bg-black/60 transition-opacity md:hidden ${sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* Сайдбар: на мобильных — drawer, на md+ — в потоке на всю высоту */}
      <aside
        className={`flex w-[14.5rem] shrink-0 flex-col border-r border-neutral-800 transition-transform duration-200 ease-out max-md:fixed max-md:left-0 max-md:top-0 max-md:z-20 max-md:h-full max-md:bg-black/95 md:relative md:min-h-full md:translate-x-0 md:bg-black/50 ${sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}
        style={{ boxShadow: `1px 0 0 0 ${ACCENT}20` }}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4 pt-16 md:pt-4">
          <Link to="/dashboard" className="mb-6 hidden justify-center p-2 md:flex" onClick={() => setSidebarOpen(false)}>
            <img
              src="/image.png"
              alt=""
              className="h-24 w-auto object-contain md:h-28"
            />
          </Link>
          <nav className="flex flex-1 flex-col justify-center gap-1">
            {COMPANY_ITEMS.map(({ to, label, image }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800/80 hover:text-white"
                  style={
                    isActive
                      ? {
                          backgroundColor: `${ACCENT}25`,
                          color: ACCENT,
                          borderLeft: `3px solid ${ACCENT}`,
                        }
                      : undefined
                  }
                >
                  <img
                    src={image}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                  <span className="min-w-0 flex-1">{label}</span>
                  <span
                    className="flex h-2.5 w-2.5 shrink-0 rounded-full border-2"
                    style={{
                      borderColor: isActive ? ACCENT : "currentColor",
                      backgroundColor: isActive ? ACCENT : "transparent",
                      color: "rgb(115 115 115)",
                    }}
                    aria-hidden
                  />
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-neutral-800 pt-3" style={{ borderColor: `${ACCENT}30` }}>
            <Link
              to={TODO_ITEM.to}
              onClick={() => setSidebarOpen(false)}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-medium transition-colors hover:bg-neutral-800/80"
            style={{
              borderColor: location.pathname === TODO_ITEM.to ? ACCENT : "rgb(64 64 64)",
              backgroundColor: location.pathname === TODO_ITEM.to ? `${ACCENT}20` : "rgba(0,0,0,0.3)",
              color: location.pathname === TODO_ITEM.to ? ACCENT : "rgb(212 212 212)",
            }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-700 text-xs text-neutral-400">
              ✓
            </span>
            <span className="min-w-0 flex-1">{TODO_ITEM.label}</span>
            <span
              className="flex h-2.5 w-2.5 shrink-0 rounded-full border-2"
              style={{
                borderColor: location.pathname === TODO_ITEM.to ? ACCENT : "currentColor",
                backgroundColor: location.pathname === TODO_ITEM.to ? ACCENT : "transparent",
                color: "rgb(115 115 115)",
              }}
              aria-hidden
            />
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 cursor-pointer rounded-lg px-4 py-3.5 text-left text-sm font-medium text-neutral-400 transition-colors hover:bg-neutral-800/80 hover:text-red-400"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="relative z-10 min-h-svh min-w-0 flex-1 overflow-auto p-4 pt-16 md:p-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  )
}
