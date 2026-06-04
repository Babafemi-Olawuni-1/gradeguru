import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Edit2, UserX, Upload, Download, X, Check, Camera } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { resolveUrl } from '../../utils/resolveUrl'
import styles from './AdminPage.module.css'
import ss from './Students.module.css'

// Same hierarchy sort used on Classes page
const CLASS_ORDER = [
  'Nursery 1','Nursery 2','KG 1','KG 2','KG 3',
  'Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6',
  'JSS 1','JSS 2','JSS 3',
  'SSS 1','SSS 1 Science','SSS 1 Arts','SSS 1 Commercial',
  'SSS 2','SSS 2 Science','SSS 2 Arts','SSS 2 Commercial',
  'SSS 3','SSS 3 Science','SSS 3 Arts','SSS 3 Commercial',
]
function sortClasses(arr) {
  return [...arr].sort((a, b) => {
    const ai = CLASS_ORDER.indexOf(a.name), bi = CLASS_ORDER.indexOf(b.name)
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1; if (bi === -1) return -1
    return ai - bi
  })
}

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

const empty = {
  surname: '', first_name: '', last_name: '',
  admission_number: '', class_id: '',
  date_of_birth: '', sex: '',
}

export default function Students() {
  const { get, post, put, del } = useApi()
  const [students, setStudents] = useState([])
  const [classes,  setClasses]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(empty)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [editId,   setEditId]   = useState(null)

  // Passport photo
  const [photoFile,    setPhotoFile]    = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoRef = useRef()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/students?page=${page}&search=${encodeURIComponent(search)}`
      if (classFilter) url += `&class_id=${classFilter}`
      const res = await get(url)
      setStudents(res.data.items); setTotal(res.data.total)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, search, classFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { get('/classes').then(r => setClasses(sortClasses(r.data || []))).catch(() => {}) }, [])

  const openAdd = () => {
    setForm(empty); setEditId(null); setError('')
    setPhotoFile(null); setPhotoPreview(null); setModal('add')
  }

  const openEdit = (s) => {
    setForm({
      surname:          s.surname          || '',
      first_name:       s.first_name       || '',
      last_name:        s.last_name        || '',
      admission_number: s.admission_number || '',
      class_id:         s.class_id         || '',
      date_of_birth:    s.date_of_birth    || '',
      sex:              s.sex              || '',
    })
    setEditId(s.id); setError('')
    setPhotoFile(null)
    setPhotoPreview(s.photo_url ? resolveUrl(s.photo_url) : null)
    setModal('edit')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const uploadPhoto = async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'gallery') // reuse gallery upload, stores in uploads/gallery
    const res = await fetch('/api/school/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('gg_token')}` },
      body: fd,
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'Photo upload failed')
    return data.data.url
  }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form }

      if (photoFile) {
        payload.photo_url = await uploadPhoto(photoFile)
      }

      if (editId) await put(`/students?id=${editId}`, payload)
      else        await post('/students', payload)

      setModal(null); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this student?')) return
    try { await del(`/students?id=${id}`); load() } catch (e) { alert(e.message) }
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <AdminLayout title="Students">
      <div className={styles.pageHead}>
        <div className={ss.filters}>
          <div className={styles.searchWrap}>
            <Search size={16} />
            <input
              placeholder="Search by name or admission no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select
            className={ss.classFilter}
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className={styles.headActions}>
          <button className={styles.btnOutline} onClick={() => setModal('csv')}>
            <Upload size={16} /> Import CSV
          </button>
          <button className={styles.btnPrimary} onClick={openAdd}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Photo</th><th>Name</th><th>Adm. No.</th>
              <th>Class</th><th>Sex</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><span className={styles.skeleton} /></td>)}</tr>
              ))
            ) : students.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No students found. <button onClick={openAdd}>Add one</button></td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div className={ss.photoThumb}>
                    {s.photo_url
                      ? <img src={resolveUrl(s.photo_url)} alt={s.first_name} />
                      : <span>{(s.surname || s.first_name)?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                </td>
                <td>
                  <strong>{s.surname ? `${s.surname}, ` : ''}{s.first_name} {s.last_name}</strong>
                </td>
                <td><code>{s.admission_number}</code></td>
                <td>{s.class_name || <span className={styles.dim}>—</span>}</td>
                <td>{s.sex || <span className={styles.dim}>—</span>}</td>
                <td>
                  <span className={s.is_active ? styles.badgeGreen : styles.badgeRed}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className={styles.rowActions}>
                    <button onClick={() => openEdit(s)} title="Edit"><Edit2 size={15} /></button>
                    <button
                      onClick={() => handleDeactivate(s.id)} title="Deactivate"
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

      <div className={styles.pagination}>
        <span>{total} student{total !== 1 ? 's' : ''}</span>
        <div className={styles.pages}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page}</span>
          <button disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      {/* ── Add / Edit modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Student' : 'Edit Student'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className={styles.form}>
            {error && <div className={styles.formError}>{error}</div>}

            {/* Passport photo */}
            <div className={ss.photoUploadRow}>
              <div className={ss.photoUpload} onClick={() => photoRef.current.click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="Passport" />
                  : <div className={ss.photoPlaceholder}><Camera size={22} /></div>
                }
                <div className={ss.photoOverlay}><Camera size={14} /> Photo</div>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
              <p className={ss.photoHint}>Passport photo<br />(optional, max 5MB)</p>
            </div>

            {/* Name row */}
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Surname</label>
                <input value={form.surname} onChange={f('surname')} placeholder="e.g. Okonkwo" />
              </div>
              <div className={styles.field}>
                <label>First Name <span className={ss.req}>*</span></label>
                <input required value={form.first_name} onChange={f('first_name')} placeholder="e.g. Chidi" />
              </div>
              <div className={styles.field}>
                <label>Other Name</label>
                <input value={form.last_name} onChange={f('last_name')} placeholder="e.g. Emmanuel" />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Admission Number <span className={ss.req}>*</span></label>
                <input required value={form.admission_number} onChange={f('admission_number')} placeholder="e.g. GF/2024/001" />
              </div>
              <div className={styles.field}>
                <label>Sex</label>
                <select value={form.sex} onChange={f('sex')}>
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={f('date_of_birth')} />
              </div>
              <div className={styles.field}>
                <label>Class</label>
                <select value={form.class_id} onChange={f('class_id')}>
                  <option value="">— Select class —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={15} /> {modal === 'add' ? 'Add Student' : 'Save Changes'}</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── CSV import modal ── */}
      {modal === 'csv' && (
        <Modal title="Import Students via CSV" onClose={() => setModal(null)}>
          <div className={styles.csvInfo}>
            <p>Download the template, fill it in, then upload. Columns: surname, first_name, last_name, admission_number, sex, date_of_birth, class_name.</p>
            <a href="/csv-templates" target="_blank" className={styles.btnOutline}>
              <Download size={15} /> Download Template
            </a>
            <div className={styles.field} style={{ marginTop: '1rem' }}>
              <label>Upload CSV File</label>
              <input type="file" accept=".csv" />
            </div>
            <button className={styles.btnPrimary} style={{ marginTop: '1rem', width: '100%' }}>
              Upload & Import
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
