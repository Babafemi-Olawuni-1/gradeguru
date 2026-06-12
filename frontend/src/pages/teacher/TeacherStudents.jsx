import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import TeacherLayout from './TeacherLayout'
import { useApi } from '../../hooks/useApi'
import { resolveUrl } from '../../utils/resolveUrl'
import styles from '../admin/AdminPage.module.css'

export default function TeacherStudents() {
  const { get } = useApi()
  const [students, setStudents] = useState([])
  const [classes,  setClasses]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/students?page=${page}&search=${encodeURIComponent(search)}`
      if (classFilter) url += `&class_id=${classFilter}`
      const res = await get(url)
      setStudents(res.data.items); setTotal(res.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, search, classFilter, get])

  useEffect(() => { load() }, [load])
  useEffect(() => { get('/classes').then(r => setClasses(r.data || [])).catch(() => {}) }, [get])

  return (
    <TeacherLayout title="My Students">
      <div className={styles.pageHead}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className={styles.searchWrap}>
            <Search size={16} />
            <input
              placeholder="Search by name or admission no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--white)', padding: '0.5rem 0.75rem' }}
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Photo</th><th>Name</th><th>Adm. No.</th><th>Class</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><span className={styles.skeleton} /></td>)}</tr>
              ))
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>No students found.</td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {s.photo_url
                      ? <img src={resolveUrl(s.photo_url)} alt={s.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (s.last_name || s.first_name)?.[0]?.toUpperCase()
                    }
                  </div>
                </td>
                <td><strong>{s.last_name} {s.first_name}</strong></td>
                <td><code>{s.admission_number}</code></td>
                <td>{s.class_name || <span className={styles.dim}>—</span>}</td>
                <td>
                  <span className={s.is_active ? styles.badgeGreen : styles.badgeRed}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>{total} student{total !== 1 ? 's' : ''}</span>
        <div className={styles.pages}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page}</span>
          <button disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </TeacherLayout>
  )
}
