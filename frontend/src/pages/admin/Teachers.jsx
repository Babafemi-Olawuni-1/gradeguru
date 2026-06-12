import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, UserX, X, Check, Copy, User } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminPage.module.css'

function Modal({ title, onClose, children }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const empty = { first_name: '', last_name: '', email: '', password: '' }

export default function Teachers() {
  const { get, post, put, del } = useApi()
  const { school } = useAuth()
  const [teachers,   setTeachers]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [form,       setForm]       = useState(empty)
  const [editId,     setEditId]     = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [newTeacher, setNewTeacher] = useState(null) // holds newly created teacher credentials
  const [copied,     setCopied]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get('/teachers')
      setTeachers(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setForm(empty); setEditId(null); setError(''); setNewTeacher(null); setModal('add')
  }

  const openEdit = (t) => {
    setForm({ first_name: t.first_name, last_name: t.last_name, email: t.email || '', password: '' })
    setEditId(t.id); setError(''); setModal('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) {
        const payload = { first_name: form.first_name, last_name: form.last_name }
        if (form.password) payload.password = form.password
        await put(`/teachers?id=${editId}`, payload)
        setModal(null)
        load()
      } else {
        // Create new teacher
        const payload = { first_name: form.first_name, last_name: form.last_name }
        if (form.email) payload.email = form.email
        const res = await post('/teachers', payload)
        // Show credentials modal
        setNewTeacher(res.data)
        setModal('credentials')
        load()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this teacher? They will lose access.')) return
    try { await del(`/teachers?id=${id}`); load() } catch (e) { alert(e.message) }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <AdminLayout title="Teachers">
      <div className={styles.pageHead}>
        <div />
        <button className={styles.btnPrimary} onClick={openAdd}>
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Assignments</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><span className={styles.skeleton} /></td>)}</tr>
              ))
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  No teachers yet. <button onClick={openAdd}>Add one</button>
                </td>
              </tr>
            ) : teachers.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--purple-dim)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', fontWeight: 700, color: 'var(--purple-light)',
                      flexShrink: 0,
                    }}>
                      {t.first_name?.[0]}{t.last_name?.[0]}
                    </div>
                    <strong>{t.first_name} {t.last_name}</strong>
                  </div>
                </td>
                <td>
                  {t.username
                    ? <code style={{ fontSize: '0.8rem' }}>{t.username}</code>
                    : <span className={styles.dim}>—</span>
                  }
                </td>
                <td>
                  {t.assignments
                    ? <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t.assignments}</span>
                    : <span className={styles.dim}>No assignments</span>
                  }
                </td>
                <td>
                  <span className={t.is_active ? styles.badgeGreen : styles.badgeRed}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <button onClick={() => openEdit(t)} title="Edit"><Edit2 size={15} /></button>
                    <button
                      onClick={() => handleDeactivate(t.id)}
                      title="Deactivate"
                      onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.borderColor='#ef4444' }}
                      onMouseLeave={e => { e.currentTarget.style.color=''; e.currentTarget.style.background=''; e.currentTarget.style.borderColor='' }}
                    >
                      <UserX size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add Teacher' : 'Edit Teacher'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className={styles.form}>
            {error && <div className={styles.formError}>{error}</div>}

            {modal === 'add' && (
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
                fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--text-dim)'
              }}>
                <strong style={{ color: 'var(--purple-light)' }}>Auto-generated login:</strong><br />
                A unique username will be created automatically. Default password = your school name (lowercase, no spaces).
                You'll see the credentials after saving.
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>First Name *</label>
                <input
                  required
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  placeholder="e.g. Amaka"
                />
              </div>
              <div className={styles.field}>
                <label>Last Name *</label>
                <input
                  required
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  placeholder="e.g. Obi"
                />
              </div>
            </div>

            {modal === 'add' && (
              <div className={styles.field}>
                <label>Email <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@school.com (optional)"
                />
              </div>
            )}

            {modal === 'edit' && (
              <div className={styles.field}>
                <label>
                  New Password
                  <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>
                    (leave blank to keep current)
                  </span>
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                />
              </div>
            )}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={15} /> {modal === 'add' ? 'Create Teacher' : 'Save Changes'}</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Credentials Modal (shown after teacher creation) ── */}
      {modal === 'credentials' && newTeacher && (
        <Modal title="Teacher Created — Share Credentials" onClose={() => { setModal(null); setNewTeacher(null) }}>
          <div className={styles.form}>
            <div style={{
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', textAlign: 'center'
            }}>
              <Check size={32} color="#4ade80" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 700, color: '#4ade80', marginBottom: '0.25rem' }}>
                {newTeacher.first_name} {newTeacher.last_name} has been added!
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Share these login credentials with the teacher.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Login page */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Login page</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '0.85rem' }}>{window.location.origin}/login</code>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                    onClick={() => copyText(`${window.location.origin}/login`, 'url')}
                  >
                    {copied === 'url' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Username */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Username</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700 }}>{newTeacher.username}</code>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                    onClick={() => copyText(newTeacher.username, 'user')}
                  >
                    {copied === 'user' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Default password */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Default Password</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700 }}>{newTeacher.default_password}</code>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                    onClick={() => copyText(newTeacher.default_password, 'pass')}
                  >
                    {copied === 'pass' ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.75rem', textAlign: 'center' }}>
              Ask the teacher to change their password after first login.
            </p>

            <button
              className={styles.btnPrimary}
              style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
              onClick={() => { setModal(null); setNewTeacher(null) }}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
