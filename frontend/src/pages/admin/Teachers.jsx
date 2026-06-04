import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, UserX, X, Check } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
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
  const [teachers, setTeachers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null) // 'add' | 'edit'
  const [form,     setForm]     = useState(empty)
  const [editId,   setEditId]   = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await get('/teachers'); setTeachers(res.data || []) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setForm(empty); setEditId(null); setError(''); setModal('add')
  }

  const openEdit = (t) => {
    setForm({ first_name: t.first_name, last_name: t.last_name, email: t.email, password: '' })
    setEditId(t.id); setError(''); setModal('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) {
        // Only send password if filled in
        const payload = { first_name: form.first_name, last_name: form.last_name, email: form.email }
        if (form.password) payload.password = form.password
        await put(`/teachers?id=${editId}`, payload)
      } else {
        await post('/teachers', form)
      }
      setModal(null); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this teacher? They will lose access.')) return
    try { await del(`/teachers?id=${id}`); load() } catch (e) { alert(e.message) }
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
              <th>Name</th><th>Email</th><th>Assignments</th><th>Status</th><th>Actions</th>
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
                <td><strong>{t.first_name} {t.last_name}</strong></td>
                <td>{t.email}</td>
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
                      style={{ '--hover-color': '#ef4444', '--hover-bg': '#fef2f2', '--hover-border': '#ef4444' }}
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

      {(modal === 'add' || modal === 'edit') && (
        <Modal
          title={modal === 'add' ? 'Add Teacher' : 'Edit Teacher'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className={styles.form}>
            {error && <div className={styles.formError}>{error}</div>}
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>First Name</label>
                <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Last Name</label>
                <input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                readOnly={modal === 'edit'} // email can't change on edit
                style={modal === 'edit' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>
            <div className={styles.field}>
              <label>
                {modal === 'edit' ? 'New Password' : 'Temporary Password'}
                {modal === 'edit' && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}>(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                required={modal === 'add'}
                minLength={modal === 'add' ? 8 : 0}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={modal === 'edit' ? 'Leave blank to keep current' : 'Min 8 characters'}
              />
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={15} /> {modal === 'add' ? 'Create Teacher' : 'Save Changes'}</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
