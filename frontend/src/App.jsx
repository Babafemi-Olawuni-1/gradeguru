import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Landing       from './pages/Landing'
import Register      from './pages/Register'
import Login         from './pages/Login'
import About         from './pages/company/About'
import Privacy       from './pages/company/Privacy'
import Terms         from './pages/company/Terms'
import Contact       from './pages/company/Contact'
import Documentation from './pages/resources/Documentation'
import CsvTemplates  from './pages/resources/CsvTemplates'
import Support       from './pages/resources/Support'
import SchoolPage    from './pages/SchoolPage'

import Dashboard     from './pages/admin/Dashboard'
import Students      from './pages/admin/Students'
import Teachers      from './pages/admin/Teachers'
import Classes       from './pages/admin/Classes'
import Pins          from './pages/admin/Pins'
import Wallet        from './pages/admin/Wallet'
import Announcements from './pages/admin/Announcements'
import Onboarding    from './pages/admin/Onboarding'
import Settings      from './pages/admin/Settings'
import Pricing       from './pages/admin/Pricing'

function PrivateRoute({ children, role }) {
  const { user, token } = useAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"              element={<Landing />} />
      <Route path="/register"      element={<Register />} />
      <Route path="/login"         element={<Login />} />
      <Route path="/about"         element={<About />} />
      <Route path="/privacy"       element={<Privacy />} />
      <Route path="/terms"         element={<Terms />} />
      <Route path="/contact"       element={<Contact />} />
      <Route path="/docs"          element={<Documentation />} />
      <Route path="/csv-templates" element={<CsvTemplates />} />
      <Route path="/support"       element={<Support />} />

      {/* School public page */}
      <Route path="/s/:slug" element={<SchoolPage />} />

      {/* School Admin */}
      <Route path="/admin/onboarding"    element={<PrivateRoute role="school_admin"><Onboarding /></PrivateRoute>} />
      <Route path="/admin"               element={<PrivateRoute role="school_admin"><Dashboard /></PrivateRoute>} />
      <Route path="/admin/students"      element={<PrivateRoute role="school_admin"><Students /></PrivateRoute>} />
      <Route path="/admin/teachers"      element={<PrivateRoute role="school_admin"><Teachers /></PrivateRoute>} />
      <Route path="/admin/classes"       element={<PrivateRoute role="school_admin"><Classes /></PrivateRoute>} />
      <Route path="/admin/pins"          element={<PrivateRoute role="school_admin"><Pins /></PrivateRoute>} />
      <Route path="/admin/wallet"        element={<PrivateRoute role="school_admin"><Wallet /></PrivateRoute>} />
      <Route path="/admin/announcements" element={<PrivateRoute role="school_admin"><Announcements /></PrivateRoute>} />
      <Route path="/admin/settings"      element={<PrivateRoute role="school_admin"><Settings /></PrivateRoute>} />
      <Route path="/admin/pricing"       element={<PrivateRoute role="school_admin"><Pricing /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
