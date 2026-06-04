import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import styles from './AdminPage.module.css'

const empty = { title: '', body: '', publish_at: '', is_published: 1 }

export default function Announcements() {
  const { get, post, put, del } = useApi()
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(empty)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await get('/announcements'); setItems(res.data || []) }
    catch(e) {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd  = () => { setForm(empty); setEditId(null); setModal(true) }
  const openEdit = (a) => { setForm({ title: a.title, body: a.body, publish_at: a.publish_at || '', is_published: a.is_published }); setEditId(a.id); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await put(`/announcements?id=${editId}`, form)
      else        await post('/announcements', form)
      setModal(false); load()
    } catch(e) { setError(e.message) } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try { await del(`/announcements?id=${id}`); load() } catch(e) { alert(e.message) }
  }

  return (
    <AdminLayout title="Announcements">
      <div className={styles.pageHead}>
        <div />
        <button className={styles.btnPrimary} onClick={openAdd}><Plus size={16} /> New Announcement</button>
      </div>

      <div className={styles.cardsGrid}>
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className={styles.card}><span className={styles.skeleton} style={{height:80}} /></div>)
        ) : items.length === 0 ? (
          <div className={styles.card} style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>
            No announcements yet. <button onClick={openAdd} style={{color:'var(--purple-light)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>Create one</button>
          </div>
        ) : items.map(a => (
          <div key={a.id} className={styles.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
              <h4 style={{fontSize:'1rem',fontWeight:700}}>{a.title}</h4>
              <span className={a.is_published ? styles.badgeGreen : styles.badgeRed}>{a.is_published ? 'Published' : 'Draft'}</span>
            </div>
            <p style={{fontSize:'0.88rem',color:'var(--white-muted)',marginBottom:'1rem',lineHeight:1.7}}>{a.body}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'0.78rem',color:'var(--text-dim)'}}>{new Date(a.created_at).toLocaleDateString()}</span>
              <div className={styles.rowActions}>
                <button onClick={() => openEdit(a)} title="Edit"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(a.id)} className="danger" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>{editId ? 'Edit' : 'New'} Announcement</h3>
              <button onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className={styles.form}>
              {error && <div className={styles.formError}>{error}</div>}
              <div className={styles.field}><label>Title</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className={styles.field}><label>Body</label><textarea required rows={4} value={form.body} onChange={e => setForm({...form, body: e.target.value})} /></div>
              <div className={styles.formRow}>
                <div className={styles.field}><label>Publish Date (optional)</label><input type="datetime-local" value={form.publish_at} onChange={e => setForm({...form, publish_at: e.target.value})} /></div>
                <div className={styles.field}>
                  <label>Status</label>
                  <select value={form.is_published} onChange={e => setForm({...form, is_published: parseInt(e.target.value)})}>
                    <option value={1}>Published</option>
                    <option value={0}>Draft</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving...' : <><Check size={15} /> Save</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
