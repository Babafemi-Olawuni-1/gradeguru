import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, X, Check, BookOpen, Users, ChevronDown, ChevronUp,
  GraduationCap, Copy, Edit2
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import styles from './AdminPage.module.css'
import cs from './Classes.module.css'

// ── Class hierarchy sort order ───────────────────────────────
// Defines the canonical order from KG → SSS 3
const CLASS_ORDER = [
  'Nursery 1','Nursery 2',
  'KG 1','KG 2','KG 3',
  'Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6',
  'JSS 1','JSS 2','JSS 3',
  'SSS 1','SSS 1 Science','SSS 1 Arts','SSS 1 Commercial',
  'SSS 2','SSS 2 Science','SSS 2 Arts','SSS 2 Commercial',
  'SSS 3','SSS 3 Science','SSS 3 Arts','SSS 3 Commercial',
]

function sortClasses(classes) {
  return [...classes].sort((a, b) => {
    const ai = CLASS_ORDER.indexOf(a.name)
    const bi = CLASS_ORDER.indexOf(b.name)
    // Known classes go first in hierarchy order; unknown ones go alphabetically at the end
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}
// ── Nigerian school class presets (hierarchy order: KG → SSS) ──
const CLASS_PRESETS = {
  'Nursery': ['Nursery 1','Nursery 2'],
  'KG': ['KG 1','KG 2','KG 3'],
  'Primary': ['Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6'],
  'JSS': ['JSS 1','JSS 2','JSS 3'],
  'SSS': ['SSS 1','SSS 2','SSS 3'],
  'SSS (Science)': ['SSS 1 Science','SSS 2 Science','SSS 3 Science'],
  'SSS (Arts)': ['SSS 1 Arts','SSS 2 Arts','SSS 3 Arts'],
  'SSS (Commercial)': ['SSS 1 Commercial','SSS 2 Commercial','SSS 3 Commercial'],
  'Nursery': ['Nursery 1','Nursery 2'],
  'KG': ['KG 1','KG 2','KG 3'],
}

// ── Nigerian subject presets by level ────────────────────────
const SUBJECT_PRESETS = {
  'Core (All levels)': [
    'English Language','Mathematics','Civic Education','Physical & Health Education',
  ],
  'Primary': [
    'Basic Science','Basic Technology','Social Studies','Cultural & Creative Arts',
    'Religious & National Values','Yoruba Language','Igbo Language','Hausa Language',
    'Computer Studies','Agricultural Science',
  ],
  'JSS': [
    'Basic Science','Basic Technology','Social Studies','Cultural & Creative Arts',
    'Business Studies','Home Economics','Agricultural Science','Computer Studies',
    'French Language','Yoruba Language','Igbo Language','Hausa Language',
    'Christian Religious Studies','Islamic Religious Studies',
  ],
  'SSS (Science)': [
    'Physics','Chemistry','Biology','Further Mathematics',
    'Agricultural Science','Computer Science','Technical Drawing',
  ],
  'SSS (Arts)': [
    'Literature in English','Government','History','Christian Religious Studies',
    'Islamic Religious Studies','Yoruba Language','Igbo Language','Hausa Language',
    'Fine Arts','Music',
  ],
  'SSS (Commercial)': [
    'Economics','Commerce','Accounting','Office Practice',
    'Marketing','Insurance','Computer Studies',
  ],
  'SSS (General)': [
    'Geography','Biology','Chemistry','Physics',
    'Economics','Government','Literature in English',
  ],
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

export default function Classes() {
  const { get, post, put, del } = useApi()

  const [classes,      setClasses]      = useState([])
  const [subjects,     setSubjects]     = useState([])
  const [teachers,     setTeachers]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [expanded,     setExpanded]     = useState(null)
  const [modal,        setModal]        = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [formErr,      setFormErr]      = useState('')
  const [classSubjects,setClassSubjects]= useState({})

  // Add class form
  const [selectedClasses, setSelectedClasses] = useState([])
  const [customClass,     setCustomClass]     = useState('')

  // Add/edit subject form
  const [editSubjectId,   setEditSubjectId]   = useState(null)
  const [subjectName,     setSubjectName]     = useState('')
  const [selectedSubjects,setSelectedSubjects]= useState([])

  // Assign subject to class
  const [assignClass,   setAssignClass]   = useState(null)

  // Copy subjects
  const [copyFrom, setCopyFrom] = useState('')
  const [copyTo,   setCopyTo]   = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [cr, sr, tr] = await Promise.all([
        get('/classes'), get('/subjects'), get('/teachers'),
      ])
      setClasses(sortClasses(cr.data || []))
      setSubjects(sr.data || [])
      setTeachers(tr.data || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const loadClassSubjects = async (classId, force = false) => {
    if (classSubjects[classId] && !force) return
    try {
      const res = await get(`/class_subjects?class_id=${classId}`)
      setClassSubjects(prev => ({ ...prev, [classId]: res.data || [] }))
    } catch {}
  }

  const toggleExpand = (classId) => {
    if (expanded === classId) { setExpanded(null); return }
    setExpanded(classId)
    loadClassSubjects(classId)
  }

  // ── Add classes (bulk from presets or custom) ─────────────
  const toggleClassPreset = (name) => {
    setSelectedClasses(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const handleAddClasses = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    const toAdd = [...new Set([
      ...selectedClasses,
      ...(customClass.trim() ? customClass.split(',').map(s => s.trim()).filter(Boolean) : [])
    ])]
    if (!toAdd.length) { setFormErr('Select or type at least one class'); setSaving(false); return }
    try {
      for (const name of toAdd) {
        try { await post('/classes', { name }) } catch (e) {
          if (!e.message.includes('already exists')) throw e
        }
      }
      setSelectedClasses([]); setCustomClass(''); setModal(null); loadAll()
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteClass = async (id) => {
    if (!confirm('Delete this class? Students in it will be unassigned.')) return
    try { await del(`/classes?id=${id}`); loadAll() } catch (e) { alert(e.message) }
  }

  // ── Add subjects (bulk from presets or custom) ────────────
  const toggleSubjectPreset = (name) => {
    setSelectedSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }

  const handleAddSubjects = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    const toAdd = [...new Set([
      ...selectedSubjects,
      ...(subjectName.trim() ? subjectName.split(',').map(s => s.trim()).filter(Boolean) : [])
    ])]
    if (!toAdd.length) { setFormErr('Select or type at least one subject'); setSaving(false); return }
    try {
      for (const name of toAdd) {
        try { await post('/subjects', { name }) } catch (e) {
          if (!e.message.includes('already exists')) throw e
        }
      }
      setSelectedSubjects([]); setSubjectName(''); setModal(null); loadAll()
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }

  // ── Edit subject ──────────────────────────────────────────
  const openEditSubject = (s) => {
    setEditSubjectId(s.id); setSubjectName(s.name); setFormErr(''); setModal('editSubject')
  }

  const handleEditSubject = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      await put(`/subjects?id=${editSubjectId}`, { name: subjectName.trim() })
      setModal(null); loadAll()
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }

  const handleDeleteSubject = async (id) => {
    if (!confirm('Delete this subject? It will be removed from all classes.')) return
    try { await del(`/subjects?id=${id}`); loadAll() } catch (e) { alert(e.message) }
  }

  // ── Assign subjects to class (bulk checklist) ────────────
  const [assignedIds,   setAssignedIds]   = useState(new Set())

  const openAssign = async (cls) => {
    setAssignClass(cls); setFormErr(''); setSaving(false)
    // Load what's already assigned so we can pre-check them
    try {
      const res = await get(`/class_subjects?class_id=${cls.id}`)
      const already = new Set((res.data || []).map(s => String(s.subject_id)))
      setAssignedIds(already)
      setClassSubjects(prev => ({ ...prev, [cls.id]: res.data || [] }))
    } catch { setAssignedIds(new Set()) }
    setModal('assign')
  }

  const toggleAssignSubject = (id) => {
    setAssignedIds(prev => {
      const next = new Set(prev)
      next.has(String(id)) ? next.delete(String(id)) : next.add(String(id))
      return next
    })
  }

  const handleAssign = async (e) => {
    e.preventDefault(); setSaving(true); setFormErr('')
    try {
      // Current assignments from DB
      const currentRes = await get(`/class_subjects?class_id=${assignClass.id}`)
      const current = currentRes.data || []
      const currentIds = new Set(current.map(s => String(s.subject_id)))

      // Add newly checked subjects
      for (const id of assignedIds) {
        if (!currentIds.has(id)) {
          try { await post('/class_subjects', { class_id: assignClass.id, subject_id: id }) } catch {}
        }
      }
      // Remove unchecked subjects
      for (const s of current) {
        if (!assignedIds.has(String(s.subject_id))) {
          try { await del(`/class_subjects?id=${s.id}`) } catch {}
        }
      }

      setClassSubjects(prev => ({ ...prev, [assignClass.id]: null }))
      if (expanded === assignClass.id) loadClassSubjects(assignClass.id, true)
      setModal(null)
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }

  const handleRemoveSubject = async (classId, csId) => {
    if (!confirm('Remove this subject from the class?')) return
    try {
      await del(`/class_subjects?id=${csId}`)
      setClassSubjects(prev => ({
        ...prev, [classId]: (prev[classId] || []).filter(c => c.id !== csId)
      }))
    } catch (e) { alert(e.message) }
  }

  // ── Copy subjects from one class to another ───────────────
  const handleCopySubjects = async (e) => {
    e.preventDefault()
    if (!copyFrom || !copyTo) { setFormErr('Select both classes'); return }
    if (copyFrom === copyTo)  { setFormErr('Source and destination must be different'); return }
    setSaving(true); setFormErr('')
    try {
      // Load source subjects if not already loaded
      const srcRes = await get(`/class_subjects?class_id=${copyFrom}`)
      const srcSubjects = srcRes.data || []
      if (!srcSubjects.length) { setFormErr('Source class has no subjects to copy'); setSaving(false); return }

      // Load dest subjects to avoid duplicates
      const dstRes = await get(`/class_subjects?class_id=${copyTo}`)
      const dstSubjectIds = new Set((dstRes.data || []).map(s => String(s.subject_id)))

      let copied = 0
      for (const s of srcSubjects) {
        if (!dstSubjectIds.has(String(s.subject_id))) {
          try {
            await post('/class_subjects', { class_id: copyTo, subject_id: s.subject_id })
            copied++
          } catch {}
        }
      }
      // Refresh destination
      setClassSubjects(prev => ({ ...prev, [copyTo]: null }))
      if (expanded === parseInt(copyTo)) loadClassSubjects(copyTo, true)
      setModal(null)
      alert(`Copied ${copied} subject${copied !== 1 ? 's' : ''} successfully.`)
    } catch (e) { setFormErr(e.message) }
    finally { setSaving(false) }
  }

  return (
    <AdminLayout title="Classes & Subjects">
      <div className={styles.pageHead}>
        <div className={cs.headerLeft}>
          <span className={cs.stat}><BookOpen size={15} /> {classes.length} Classes</span>
          <span className={cs.stat}><GraduationCap size={15} /> {subjects.length} Subjects</span>
        </div>
        <div className={styles.headActions}>
          <button className={styles.btnOutline} onClick={() => { setCopyFrom(''); setCopyTo(''); setFormErr(''); setModal('copy') }}>
            <Copy size={16} /> Copy Subjects
          </button>
          <button className={styles.btnOutline} onClick={() => { setSelectedSubjects([]); setSubjectName(''); setFormErr(''); setModal('subject') }}>
            <Plus size={16} /> Add Subjects
          </button>
          <button className={styles.btnPrimary} onClick={() => { setSelectedClasses([]); setCustomClass(''); setFormErr(''); setModal('class') }}>
            <Plus size={16} /> Add Classes
          </button>
        </div>
      </div>

      {error && <div className={cs.pageError}>{error}</div>}

      <div className={cs.layout}>
        {/* ── Classes panel ── */}
        <div className={cs.panel}>
          <div className={cs.panelHead}>
            <h3><BookOpen size={16} /> Classes</h3>
            <span className={cs.count}>{classes.length}</span>
          </div>

          {loading ? (
            <div className={cs.skeletonList}>{[...Array(4)].map((_, i) => <div key={i} className={cs.skeletonRow} />)}</div>
          ) : classes.length === 0 ? (
            <div className={cs.empty}>
              <BookOpen size={32} />
              <p>No classes yet</p>
              <button className={styles.btnPrimary} onClick={() => { setSelectedClasses([]); setModal('class') }}>
                <Plus size={15} /> Add Classes
              </button>
            </div>
          ) : (
            <div className={cs.classList}>
              {classes.map(cls => (
                <div key={cls.id} className={cs.classItem}>
                  <div className={cs.classRow} onClick={() => toggleExpand(cls.id)}>
                    <div className={cs.classInfo}>
                      <div className={cs.classIcon}><BookOpen size={16} /></div>
                      <div>
                        <strong>{cls.name}</strong>
                        <span><Users size={12} /> {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className={cs.classActions}>
                      <button className={cs.assignBtn} onClick={e => { e.stopPropagation(); openAssign(cls) }} title="Add subject">
                        <Plus size={14} /> Subject
                      </button>
                      <button className={cs.deleteBtn} onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id) }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                      {expanded === cls.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {expanded === cls.id && (
                    <div className={cs.subjectList}>
                      {!classSubjects[cls.id] ? (
                        <div className={cs.subjectLoading}>Loading...</div>
                      ) : classSubjects[cls.id].length === 0 ? (
                        <div className={cs.subjectEmpty}>
                          No subjects. <button onClick={() => openAssign(cls)}>Add one</button>
                        </div>
                      ) : classSubjects[cls.id].map(s => (
                        <div key={s.id} className={cs.subjectRow}>
                          <div className={cs.subjectInfo}>
                            <span className={cs.subjectName}>{s.subject_name}</span>
                            {s.teacher_name
                              ? <span className={cs.teacherTag}><GraduationCap size={11} /> {s.teacher_name}</span>
                              : <span className={cs.noTeacher}>No teacher</span>
                            }
                          </div>
                          <button className={cs.removeBtn} onClick={() => handleRemoveSubject(cls.id, s.id)}><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Subjects panel ── */}
        <div className={cs.panel}>
          <div className={cs.panelHead}>
            <h3><GraduationCap size={16} /> Subjects</h3>
            <span className={cs.count}>{subjects.length}</span>
          </div>

          {loading ? (
            <div className={cs.skeletonList}>{[...Array(6)].map((_, i) => <div key={i} className={cs.skeletonRow} />)}</div>
          ) : subjects.length === 0 ? (
            <div className={cs.empty}>
              <GraduationCap size={32} />
              <p>No subjects yet</p>
              <button className={styles.btnPrimary} onClick={() => { setSelectedSubjects([]); setModal('subject') }}>
                <Plus size={15} /> Add Subjects
              </button>
            </div>
          ) : (
            <div className={cs.subjectMasterList}>
              {subjects.map(s => (
                <div key={s.id} className={cs.subjectMasterRow}>
                  <span>{s.name}</span>
                  <div className={cs.subjectRowActions}>
                    <button className={cs.editBtn} onClick={() => openEditSubject(s)} title="Rename"><Edit2 size={13} /></button>
                    <button className={cs.deleteBtn} onClick={() => handleDeleteSubject(s.id)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Classes modal ── */}
      {modal === 'class' && (
        <Modal title="Add Classes" onClose={() => setModal(null)}>
          <form onSubmit={handleAddClasses} className={styles.form}>
            {formErr && <div className={styles.formError}>{formErr}</div>}
            <p className={cs.modalHint}>Pick from presets or type custom names separated by commas.</p>

            {Object.entries(CLASS_PRESETS).map(([group, names]) => (
              <div key={group} className={cs.presetGroup}>
                <div className={cs.presetGroupLabel}>{group}</div>
                <div className={cs.chips}>
                  {names.map(name => {
                    const exists = classes.some(c => c.name === name)
                    const selected = selectedClasses.includes(name)
                    return (
                      <button
                        key={name} type="button"
                        className={`${cs.chip} ${selected ? cs.chipSelected : ''} ${exists ? cs.chipExists : ''}`}
                        onClick={() => !exists && toggleClassPreset(name)}
                        title={exists ? 'Already added' : ''}
                      >
                        {name} {exists && '✓'}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className={styles.field}>
              <label>Custom class names <span className={cs.hint}>(comma-separated)</span></label>
              <input
                value={customClass}
                onChange={e => setCustomClass(e.target.value)}
                placeholder="e.g. Form 1, Form 2, Year 7"
              />
            </div>

            {selectedClasses.length > 0 && (
              <div className={cs.selectedPreview}>
                <strong>Will add:</strong> {selectedClasses.join(', ')}
              </div>
            )}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Adding...' : <><Check size={15} /> Add Classes</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Add Subjects modal ── */}
      {modal === 'subject' && (
        <Modal title="Add Subjects" onClose={() => setModal(null)}>
          <form onSubmit={handleAddSubjects} className={styles.form}>
            {formErr && <div className={styles.formError}>{formErr}</div>}
            <p className={cs.modalHint}>Pick from presets or type custom names separated by commas.</p>

            {Object.entries(SUBJECT_PRESETS).map(([group, names]) => (
              <div key={group} className={cs.presetGroup}>
                <div className={cs.presetGroupLabel}>{group}</div>
                <div className={cs.chips}>
                  {names.map(name => {
                    const exists = subjects.some(s => s.name === name)
                    const selected = selectedSubjects.includes(name)
                    return (
                      <button
                        key={name} type="button"
                        className={`${cs.chip} ${selected ? cs.chipSelected : ''} ${exists ? cs.chipExists : ''}`}
                        onClick={() => !exists && toggleSubjectPreset(name)}
                        title={exists ? 'Already added' : ''}
                      >
                        {name} {exists && '✓'}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className={styles.field}>
              <label>Custom subject names <span className={cs.hint}>(comma-separated)</span></label>
              <input
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                placeholder="e.g. Drama, Music, French"
              />
            </div>

            {selectedSubjects.length > 0 && (
              <div className={cs.selectedPreview}>
                <strong>Will add:</strong> {selectedSubjects.join(', ')}
              </div>
            )}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Adding...' : <><Check size={15} /> Add Subjects</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Subject modal ── */}
      {modal === 'editSubject' && (
        <Modal title="Rename Subject" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSubject} className={styles.form}>
            {formErr && <div className={styles.formError}>{formErr}</div>}
            <div className={styles.field}>
              <label>Subject Name</label>
              <input required autoFocus value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={15} /> Save</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Assign subjects to class modal (checklist) ── */}
      {modal === 'assign' && assignClass && (
        <Modal title={`Subjects for ${assignClass.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAssign} className={styles.form}>
            {formErr && <div className={styles.formError}>{formErr}</div>}
            <p className={cs.modalHint}>
              Check all subjects this class should have. Unchecking removes them.
            </p>

            {subjects.length === 0 ? (
              <div className={cs.noSubjectsHint}>
                No subjects created yet.{' '}
                <button type="button" onClick={() => setModal('subject')} style={{ color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Add subjects first
                </button>
              </div>
            ) : (
              <>
                <div className={cs.subjectChecklist}>
                  {/* Select all / none */}
                  <div className={cs.checklistControls}>
                    <button type="button" className={cs.selectAllBtn}
                      onClick={() => setAssignedIds(new Set(subjects.map(s => String(s.id))))}>
                      Select All
                    </button>
                    <button type="button" className={cs.selectAllBtn}
                      onClick={() => setAssignedIds(new Set())}>
                      Clear All
                    </button>
                    <span className={cs.selectedCount}>{assignedIds.size} selected</span>
                  </div>

                  {Object.entries(SUBJECT_PRESETS).map(([group, names]) => {
                    const groupSubjects = subjects.filter(s => names.includes(s.name))
                    if (!groupSubjects.length) return null
                    return (
                      <div key={group} className={cs.checklistGroup}>
                        <div className={cs.checklistGroupLabel}>{group}</div>
                        {groupSubjects.map(s => (
                          <label key={s.id} className={cs.checkItem}>
                            <input
                              type="checkbox"
                              checked={assignedIds.has(String(s.id))}
                              onChange={() => toggleAssignSubject(s.id)}
                            />
                            <span>{s.name}</span>
                          </label>
                        ))}
                      </div>
                    )
                  })}

                  {/* Any subjects not in presets */}
                  {(() => {
                    const allPresetNames = Object.values(SUBJECT_PRESETS).flat()
                    const others = subjects.filter(s => !allPresetNames.includes(s.name))
                    if (!others.length) return null
                    return (
                      <div className={cs.checklistGroup}>
                        <div className={cs.checklistGroupLabel}>Other</div>
                        {others.map(s => (
                          <label key={s.id} className={cs.checkItem}>
                            <input
                              type="checkbox"
                              checked={assignedIds.has(String(s.id))}
                              onChange={() => toggleAssignSubject(s.id)}
                            />
                            <span>{s.name}</span>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </>
            )}

            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving || subjects.length === 0}>
                {saving ? 'Saving...' : <><Check size={15} /> Save Subjects</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Copy subjects modal ── */}
      {modal === 'copy' && (
        <Modal title="Copy Subjects Between Classes" onClose={() => setModal(null)}>
          <form onSubmit={handleCopySubjects} className={styles.form}>
            {formErr && <div className={styles.formError}>{formErr}</div>}
            <p className={cs.modalHint}>Copy all subjects from one class to another. Already-assigned subjects are skipped.</p>
            <div className={styles.field}>
              <label>Copy FROM</label>
              <select required value={copyFrom} onChange={e => setCopyFrom(e.target.value)}>
                <option value="">— Select source class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Copy TO</label>
              <select required value={copyTo} onChange={e => setCopyTo(e.target.value)}>
                <option value="">— Select destination class —</option>
                {classes.filter(c => c.id != copyFrom).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.btnOutline} onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Copying...' : <><Copy size={15} /> Copy Subjects</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  )
}
