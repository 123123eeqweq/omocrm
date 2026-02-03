import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom"
import { Login } from "@/pages/Login"
import { Dashboard } from "@/pages/Dashboard"
import { ComforTradePage } from "@/pages/dashboard/ComforTradePage"
import { DoviPage } from "@/pages/dashboard/DoviPage"
import { ZavdannyaPage } from "@/pages/dashboard/ZavdannyaPage"
import { isAuthenticated } from "@/lib/auth"

function AppRoutes() {

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
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
