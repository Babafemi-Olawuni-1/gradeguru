import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Key, Wallet, FileText, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import styles from './Dashboard.module.css'

const PLAN_LIMITS = { starter: { students: 5, teachers: 2 }, pro: { students: 200, teachers: 10 }, enterprise: { students: '∞', teachers: '∞' } }

export default function Dashboard() {
  const { school } = useAuth()
  const { get } = useApi()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      get('/school'),
      get('/students?per_page=1'),
      get('/pins?per_page=1'),
    ]).then(([schoolRes, studRes, pinRes]) => {
      setStats({
        school:   schoolRes.data.school,
        usage:    schoolRes.data.usage,
        limits:   schoolRes.data.limits,
        students: studRes.data.total,
        pins_used: pinRes.data.total,
        wallet:   schoolRes.data.school.wallet_balance,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const plan   = school?.plan || 'starter'
  const limits = PLAN_LIMITS[plan]

  const cards = [
    { label: 'Total Students', value: stats?.students ?? '—', icon: Users,     color: '#a78bfa', link: '/admin/students', sub: `Limit: ${limits.students}` },
    { label: 'Wallet Balance', value: stats ? `₦${Number(stats.wallet).toLocaleString()}` : '—', icon: Wallet, color: '#4ade80', link: '/admin/wallet', sub: 'Fund wallet' },
    { label: 'PINs Generated', value: stats?.pins_used ?? '—', icon: Key,      color: '#60a5fa', link: '/admin/pins',    sub: 'View all PINs' },
    { label: 'Results Published', value: '—',                  icon: FileText, color: '#f472b6', link: '/admin/results', sub: 'Manage results' },
  ]

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome */}
      <div className={styles.welcome}>
        <div>
          <h2>Welcome back, {school?.name || 'School Admin'}</h2>
          <p>Here's what's happening with your school today.</p>
          <a
            href={`/s/${school?.slug}`}
            target="_blank"
            rel="noreferrer"
            className={styles.siteLink}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
            {window.location.origin}/s/{school?.slug}
          </a>
        </div>
        <div className={styles.welcomeActions}>
          <Link to="/admin/pins" className={styles.btnPrimary}><Key size={16} /> Generate PINs</Link>
          <Link to="/admin/results" className={styles.btnOutline}><FileText size={16} /> Upload Results</Link>
        </div>
      </div>

      {/* Plan alert */}
      {plan === 'starter' && (
        <div className={styles.planAlert}>
          <AlertCircle size={18} />
          <span>You're on the <strong>Starter plan</strong> — limited to 5 students and 2 teachers. <a href="/admin/pricing">Upgrade to Pro (₦10,000/term)</a> for more.</span>
        </div>
      )}

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {cards.map(c => (
          <Link to={c.link} key={c.label} className={styles.statCard}>
            <div className={styles.statTop}>
              <div className={styles.statIcon} style={{ background: c.color + '22', color: c.color }}>
                <c.icon size={22} strokeWidth={1.8} />
              </div>
              <ArrowRight size={16} className={styles.statArrow} />
            </div>
            <div className={styles.statValue}>{loading ? <span className={styles.skeleton} /> : c.value}</div>
            <div className={styles.statLabel}>{c.label}</div>
            <div className={styles.statSub}>{c.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          {[
            { label: 'Add Student',       icon: Users,     link: '/admin/students',      desc: 'Enroll a new student' },
            { label: 'Add Teacher',       icon: Users,     link: '/admin/teachers',      desc: 'Create teacher account' },
            { label: 'Upload Results',    icon: FileText,  link: '/admin/results',       desc: 'Enter or import scores' },
            { label: 'Generate PINs',     icon: Key,       link: '/admin/pins',          desc: 'Create result access PINs' },
            { label: 'Fund Wallet',       icon: Wallet,    link: '/admin/wallet',        desc: 'Top up school wallet' },
            { label: 'Post Announcement', icon: TrendingUp,link: '/admin/announcements', desc: 'Notify parents & students' },
          ].map(a => (
            <Link to={a.link} key={a.label} className={styles.actionCard}>
              <a.icon size={20} strokeWidth={1.8} />
              <div>
                <strong>{a.label}</strong>
                <span>{a.desc}</span>
              </div>
              <ArrowRight size={14} className={styles.actionArrow} />
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
