import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Menu, X,
  LogOut, ChevronRight, Bell, Settings
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
  { label: 'My Students', icon: Users,          path: '/teacher/students' },
  { label: 'Results',     icon: FileText,        path: '/teacher/results' },
]

export default function TeacherLayout({ children, title }) {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, school, token, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const dropRef  = useRef(null)

  const handleLogout = () => { logout(); navigate('/login') }

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reuse AdminLayout styles
  const s = {
    layout: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' },
    sidebar: {
      width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 50,
      transition: 'transform 0.25s',
      position: 'fixed', top: 0, left: 0, height: '100vh',
    },
    sidebarHead: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)',
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      fontWeight: 800, fontSize: '1rem', color: 'var(--white)',
      textDecoration: 'none',
    },
    logoSpan: { color: 'var(--purple-light)' },
    schoolInfo: {
      padding: '1rem', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
    },
    avatar: {
      width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, var(--purple), #a855f7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
    },
    nav: { flex: 1, padding: '0.75rem 0', overflowY: 'auto' },
    navItem: {
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 1rem', margin: '0.1rem 0.5rem',
      borderRadius: 8, textDecoration: 'none',
      color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500,
      transition: 'all 0.15s',
    },
    navItemActive: {
      background: 'rgba(124,58,237,0.12)',
      color: 'var(--white)',
      borderLeft: '2px solid var(--purple)',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', marginLeft: 240 },
    topbar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1.5rem', background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40,
    },
    content: { padding: '1.5rem', flex: 1 },
    menuBtn: { display: 'none', background: 'none', border: 'none', color: 'var(--white)', cursor: 'pointer' },
    pageTitle: { fontSize: '1.1rem', fontWeight: 700 },
    roleTag: {
      background: 'rgba(124,58,237,0.12)', color: 'var(--purple-light)',
      border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6,
      padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600,
    },
  }

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.sidebarHead}>
          <Link to="/" style={s.logo}>
            <img src="/logo.png" alt="Exclusive Grades" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            Exclusive<span style={s.logoSpan}>Grades</span>
          </Link>
        </div>

        {school && (
          <div style={s.schoolInfo}>
            <div style={s.avatar}>{school.name?.[0]?.toUpperCase()}</div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1.3 }}>{school.name}</p>
              <span style={s.roleTag}>Teacher</span>
            </div>
          </div>
        )}

        <nav style={s.nav}>
          {nav.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path || (path !== '/teacher' && location.pathname.startsWith(path))
            return (
              <Link
                key={path}
                to={path}
                style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <h1 style={s.pageTitle}>{title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }} ref={dropRef}>
              <button
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                  color: 'var(--purple-light)', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => setDropdownOpen(o => !o)}
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, minWidth: 180, padding: '0.5rem 0', zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{user?.first_name} {user?.last_name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user?.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      width: '100%', padding: '0.6rem 1rem', background: 'none',
                      border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.88rem',
                    }}
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main style={s.content}>{children}</main>
      </div>
    </div>
  )
}
