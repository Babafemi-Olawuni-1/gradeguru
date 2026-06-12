import { useState, useEffect } from 'react'
import { Users, FileText, BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import TeacherLayout from './TeacherLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from '../admin/AdminPage.module.css'
import ds from '../admin/Dashboard.module.css'

export default function TeacherDashboard() {
  const { get } = useApi()
  const { user, school } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [students,    setStudents]    = useState(0)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      get('/teachers'),
      get('/students?per_page=1'),
    ]).then(([teachRes, studRes]) => {
      const me = (teachRes.data || []).find(t => t.id === user?.id)
      setAssignments(me?.assignments ? me.assignments.split('; ') : [])
      setStudents(studRes.data?.total || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [get, user])

  return (
    <TeacherLayout title="Dashboard">
      <div className={ds.welcome}>
        <div>
          <h2>Welcome, {user?.first_name} {user?.last_name}</h2>
          <p>You are logged in as a teacher at <strong>{school?.name}</strong></p>
        </div>
      </div>

      <div className={ds.statsGrid} style={{ marginTop: '1.5rem' }}>
        {[
          { label: 'My Assignments', value: assignments.length || '—', icon: BookOpen, color: '#a78bfa', link: '/teacher' },
          { label: 'Students',       value: students,                  icon: Users,    color: '#4ade80', link: '/teacher/students' },
          { label: 'Results',        value: 'Manage',                  icon: FileText, color: '#60a5fa', link: '/teacher/results' },
        ].map(c => (
          <Link to={c.link} key={c.label} className={ds.statCard}>
            <div className={ds.statTop}>
              <div className={ds.statIcon} style={{ background: c.color + '22', color: c.color }}>
                <c.icon size={22} strokeWidth={1.8} />
              </div>
              <ArrowRight size={16} className={ds.statArrow} />
            </div>
            <div className={ds.statValue}>{loading ? <span className={styles.skeleton} /> : c.value}</div>
            <div className={ds.statLabel}>{c.label}</div>
          </Link>
        ))}
      </div>

      {assignments.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700 }}>My Class Assignments</h3>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {assignments.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                borderBottom: i < assignments.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.9rem',
              }}>
                <BookOpen size={16} color="var(--purple-light)" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div style={{
          marginTop: '2rem', textAlign: 'center', padding: '3rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          color: 'var(--text-dim)'
        }}>
          <BookOpen size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p>You have no class assignments yet. Contact your school admin.</p>
        </div>
      )}
    </TeacherLayout>
  )
}
