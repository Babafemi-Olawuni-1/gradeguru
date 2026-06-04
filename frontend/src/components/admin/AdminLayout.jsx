import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, FileText,
  Key, Wallet, Megaphone, BarChart3, Settings, LogOut,
  Menu, X, ChevronRight, Bell, CreditCard, User
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminLayout.module.css'
import { resolveUrl } from '../../utils/resolveUrl'

const nav = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/admin' },
  { label: 'Students',     icon: Users,           path: '/admin/students' },
  { label: 'Teachers',     icon: GraduationCap,   path: '/admin/teachers' },
  { label: 'Classes',      icon: BookOpen,        path: '/admin/classes' },
  { label: 'Results',      icon: FileText,        path: '/admin/results' },
  { label: 'PINs',         icon: Key,             path: '/admin/pins' },
  { label: 'Wallet',       icon: Wallet,          path: '/admin/wallet' },
  { label: 'Announcements',icon: Megaphone,       path: '/admin/announcements' },
  { label: 'Analytics',    icon: BarChart3,       path: '/admin/analytics' },
  { label: 'Pricing',      icon: CreditCard,      path: '/admin/pricing' },
  { label: 'Settings',     icon: Settings,        path: '/admin/settings' },
]

export default function AdminLayout({ children, title }) {
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, school, token, logout, updateSchool } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  const handleLogout = () => { logout(); navigate('/login') }

  // Sync latest school data on first mount
  useEffect(() => {
    if (!token) return
    fetch('/api/school', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) updateSchool({ ...school, ...d.data.school }) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={`${styles.layout} admin-layout`}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHead}>
          <Link to="/" className={styles.logo}>Grade<span>Guru</span></Link>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        {school && (
          <div className={styles.schoolInfo}>
            <div className={styles.schoolAvatar}>
              {school.logo_url
                ? <img src={resolveUrl(school.logo_url)} alt={school.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 9 }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--purple), #a855f7)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{school.name?.[0]?.toUpperCase()}</div>
              }
            </div>
            <div>
              <p className={styles.schoolName}>{school.name}</p>
              <span className={`${styles.planBadge} ${styles['plan_' + school.plan]}`}>{school.plan}</span>
            </div>
          </div>
        )}

        <nav className={styles.nav}>
          {nav.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))
            return (
              <Link key={path} to={path} className={`${styles.navItem} ${active ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className={styles.chevron} />}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <h1 className={styles.pageTitle}>{title}</h1>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn}><Bell size={18} /></button>

            {/* Avatar with dropdown */}
            <div className={styles.avatarWrap} ref={dropdownRef}>
              <button
                className={styles.topbarAvatar}
                onClick={() => setDropdownOpen(o => !o)}
                aria-label="Account menu"
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownUser}>
                    <div className={styles.dropdownAvatar}>
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div>
                      <p>{user?.first_name} {user?.last_name}</p>
                      <span>School Admin</span>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link
                    to="/admin/settings"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} /> Settings
                  </Link>
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
