import { useState, useEffect } from 'react'
import { BarChart3, Users, Key, TrendingUp, BookOpen, Award } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminPage.module.css'
import an from './Analytics.module.css'

export default function Analytics() {
  const { get } = useApi()
  const { school } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      get('/school'),
      get('/students?per_page=1'),
      get('/pins?per_page=1'),
      get('/teachers'),
      get('/classes'),
    ]).then(([schoolRes, studRes, pinRes, teachRes, classRes]) => {
      setData({
        school:   schoolRes.data.school,
        usage:    schoolRes.data.usage,
        limits:   schoolRes.data.limits,
        students: studRes.data.total,
        pins:     pinRes.data.total,
        teachers: (teachRes.data || []).length,
        classes:  (classRes.data || []).length,
        wallet:   schoolRes.data.school.wallet_balance,
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [get])

  const plan   = school?.plan || 'starter'
  const limits = { starter: { students: 10, teachers: 2 }, pro: { students: 200, teachers: 10 }, enterprise: { students: 9999, teachers: 9999 } }[plan]

  const studentPct = data && limits.students < 9999
    ? Math.min(100, Math.round((data.students / limits.students) * 100))
    : null

  const teacherPct = data && limits.teachers < 9999
    ? Math.min(100, Math.round((data.teachers / limits.teachers) * 100))
    : null

  return (
    <AdminLayout title="Analytics">
      <div className={an.page}>

        {/* Summary cards */}
        <div className={an.grid}>
          {[
            { label: 'Total Students',  value: data?.students ?? '—', icon: Users,     color: '#a78bfa' },
            { label: 'Total Teachers',  value: data?.teachers ?? '—', icon: Users,     color: '#60a5fa' },
            { label: 'Total Classes',   value: data?.classes  ?? '—', icon: BookOpen,  color: '#34d399' },
            { label: 'PINs Generated',  value: data?.pins     ?? '—', icon: Key,       color: '#f472b6' },
            { label: 'Wallet Balance',  value: data ? `₦${Number(data.wallet).toLocaleString()}` : '—', icon: TrendingUp, color: '#fbbf24' },
            { label: 'Current Plan',    value: plan.charAt(0).toUpperCase() + plan.slice(1), icon: Award, color: '#c084fc' },
          ].map(c => (
            <div key={c.label} className={an.card}>
              <div className={an.cardIcon} style={{ background: c.color + '22', color: c.color }}>
                <c.icon size={22} strokeWidth={1.8} />
              </div>
              <div className={an.cardValue}>
                {loading ? <span className={styles.skeleton} style={{ width: 60, height: 28, display: 'block' }} /> : c.value}
              </div>
              <div className={an.cardLabel}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Plan usage */}
        {data && (
          <div className={an.section}>
            <h3>Plan Usage</h3>
            <div className={an.usageGrid}>
              {/* Students */}
              <div className={an.usageCard}>
                <div className={an.usageTop}>
                  <span>Students</span>
                  <span>{data.students} / {limits.students >= 9999 ? '∞' : limits.students}</span>
                </div>
                {studentPct !== null && (
                  <div className={an.progressBar}>
                    <div
                      className={an.progressFill}
                      style={{
                        width: `${studentPct}%`,
                        background: studentPct >= 90 ? '#ef4444' : studentPct >= 70 ? '#fbbf24' : '#4ade80'
                      }}
                    />
                  </div>
                )}
                {studentPct !== null && (
                  <p className={an.usagePct}>{studentPct}% used</p>
                )}
              </div>

              {/* Teachers */}
              <div className={an.usageCard}>
                <div className={an.usageTop}>
                  <span>Teachers</span>
                  <span>{data.teachers} / {limits.teachers >= 9999 ? '∞' : limits.teachers}</span>
                </div>
                {teacherPct !== null && (
                  <div className={an.progressBar}>
                    <div
                      className={an.progressFill}
                      style={{
                        width: `${teacherPct}%`,
                        background: teacherPct >= 90 ? '#ef4444' : teacherPct >= 70 ? '#fbbf24' : '#4ade80'
                      }}
                    />
                  </div>
                )}
                {teacherPct !== null && (
                  <p className={an.usagePct}>{teacherPct}% used</p>
                )}
              </div>

              {/* Wallet */}
              <div className={an.usageCard}>
                <div className={an.usageTop}>
                  <span>Wallet Balance</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>₦{Number(data.wallet).toLocaleString()}</span>
                </div>
                <p className={an.usageNote}>Used for PIN generation and add-ons.</p>
              </div>

              {/* Plan */}
              <div className={an.usageCard}>
                <div className={an.usageTop}>
                  <span>Active Plan</span>
                  <span className={`${styles['planBadge_' + plan] || ''}`} style={{ textTransform: 'capitalize', fontWeight: 700, color: 'var(--purple-light)' }}>
                    {plan}
                  </span>
                </div>
                {plan !== 'enterprise' && (
                  <a href="/admin/pricing" className={an.upgradeLink}>Upgrade for more capacity →</a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={an.section}>
          <h3>School Info</h3>
          <div className={an.infoGrid}>
            {[
              { label: 'School Name',    value: school?.name  || '—' },
              { label: 'School Slug',    value: school?.slug  || '—' },
              { label: 'School Page',    value: school?.slug ? `${window.location.origin}/s/${school.slug}` : '—', link: school?.slug ? `/s/${school.slug}` : null },
            ].map(item => (
              <div key={item.label} className={an.infoRow}>
                <span className={an.infoLabel}>{item.label}</span>
                {item.link
                  ? <a href={item.link} target="_blank" rel="noreferrer" className={an.infoLink}>{item.value}</a>
                  : <span className={an.infoValue}>{item.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
