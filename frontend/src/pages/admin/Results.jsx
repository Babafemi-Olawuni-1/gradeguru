import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, ChevronDown, Check, Save, Eye, EyeOff } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminPage.module.css'
import rs from './Results.module.css'

export default function Results() {
  const { get, post, put } = useApi()
  const { school } = useAuth()

  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [sessions,  setSessions]  = useState([])
  const [terms,     setTerms]     = useState([])

  const [classId,   setClassId]   = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [termId,    setTermId]    = useState('')

  const [gradebook, setGradebook] = useState([]) // merged: students + their results
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState({})
  const [published, setPublished] = useState(false)
  const [publishing,setPublishing]= useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  // Load dropdowns
  useEffect(() => {
    Promise.all([get('/classes'), get('/subjects'), get('/sessions')]).then(([cr, sr, sesr]) => {
      setClasses(cr.data || [])
      setSubjects(sr.data || [])
      setSessions(sesr.data || [])
    }).catch(() => {
      // Sessions endpoint might not exist yet — load classes + subjects at minimum
      Promise.all([get('/classes'), get('/subjects')]).then(([cr, sr]) => {
        setClasses(cr.data || [])
        setSubjects(sr.data || [])
      }).catch(() => {})
    })
  }, [get])

  // Load terms when session changes (terms are currently hardcoded until sessions API exists)
  const loadTerms = useCallback(async (sessionId) => {
    try {
      const res = await get(`/terms?session_id=${sessionId}`)
      setTerms(res.data || [])
    } catch {
      setTerms([])
    }
  }, [get])

  // Load gradebook whenever all three filters are set
  const loadGradebook = useCallback(async () => {
    if (!classId || !subjectId || !termId) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await get(`/results?class_id=${classId}&subject_id=${subjectId}&term_id=${termId}`)
      const { results, students } = res.data

      // Merge students with their results
      const merged = students.map(st => {
        const r = results.find(r => r.student_id === st.id) || null
        return {
          student_id: st.id,
          first_name: st.first_name,
          last_name:  st.last_name,
          admission_number: st.admission_number,
          result_id:  r?.id         || null,
          ca1:        r?.ca1        ?? '',
          ca2:        r?.ca2        ?? '',
          exam:       r?.exam       ?? '',
          total:      r?.total      ?? '',
          grade:      r?.grade      ?? '',
          remark:     r?.remark     ?? '',
          is_published: r?.is_published ?? 0,
        }
      })
      setGradebook(merged)
      setPublished(merged.some(r => r.is_published))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [classId, subjectId, termId, get])

  useEffect(() => { loadGradebook() }, [loadGradebook])

  const updateRow = (studentId, field, value) => {
    setGradebook(prev => prev.map(r =>
      r.student_id === studentId ? { ...r, [field]: value } : r
    ))
  }

  const saveRow = async (row) => {
    setSaving(prev => ({ ...prev, [row.student_id]: true }))
    setError(''); setSuccess('')
    try {
      await post('/results', {
        student_id: row.student_id,
        class_id:   parseInt(classId),
        subject_id: parseInt(subjectId),
        term_id:    parseInt(termId),
        ca1:  parseFloat(row.ca1)  || 0,
        ca2:  parseFloat(row.ca2)  || 0,
        exam: parseFloat(row.exam) || 0,
      })
      await loadGradebook()
      setSuccess('Saved.')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(prev => ({ ...prev, [row.student_id]: false }))
    }
  }

  const handlePublish = async () => {
    if (!confirm('Publish all results for this class/term? Parents will be able to view them with a PIN.')) return
    setPublishing(true); setError('')
    try {
      await put('/results', { class_id: parseInt(classId), term_id: parseInt(termId), confirm: true })
      setSuccess('Results published successfully!')
      await loadGradebook()
    } catch (e) {
      setError(e.message)
    } finally {
      setPublishing(false)
    }
  }

  const getGradeColor = (grade) => {
    if (!grade) return ''
    if (['A1','B2','B3'].includes(grade)) return rs.gradeA
    if (['C4','C5','C6'].includes(grade)) return rs.gradeB
    if (['D7','E8'].includes(grade))      return rs.gradeC
    return rs.gradeF
  }

  const allSelected = classId && subjectId && termId
  const className   = classes.find(c => c.id == classId)?.name   || ''
  const subjectName = subjects.find(s => s.id == subjectId)?.name || ''

  return (
    <AdminLayout title="Results">
      <div className={rs.page}>

        {/* Filters */}
        <div className={rs.filters}>
          <div className={rs.filterGroup}>
            <label>Class</label>
            <select value={classId} onChange={e => { setClassId(e.target.value); setGradebook([]) }}>
              <option value="">— Select class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={rs.filterGroup}>
            <label>Subject</label>
            <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setGradebook([]) }}>
              <option value="">— Select subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={rs.filterGroup}>
            <label>Term ID</label>
            <input
              type="number"
              min="1"
              placeholder="Term ID (e.g. 1)"
              value={termId}
              onChange={e => { setTermId(e.target.value); setGradebook([]) }}
              style={{ width: 120 }}
            />
          </div>
          <button
            className={styles.btnOutline}
            onClick={loadGradebook}
            disabled={!allSelected || loading}
          >
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {error   && <div className={styles.formError}  style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className={rs.successMsg}>{success}</div>}

        {!allSelected && (
          <div className={rs.emptyState}>
            <FileText size={40} />
            <p>Select a class, subject, and term to view or enter results.</p>
          </div>
        )}

        {allSelected && !loading && gradebook.length === 0 && (
          <div className={rs.emptyState}>
            <FileText size={40} />
            <p>No students in this class yet.</p>
          </div>
        )}

        {allSelected && gradebook.length > 0 && (
          <>
            <div className={rs.tableHead}>
              <div>
                <h3>{className} — {subjectName}</h3>
                <p>{gradebook.length} student{gradebook.length !== 1 ? 's' : ''}</p>
              </div>
              <div className={rs.tableActions}>
                {published && (
                  <span className={styles.badgeGreen} style={{ padding: '0.3rem 0.75rem' }}>
                    <Eye size={13} /> Published
                  </span>
                )}
                <button
                  className={styles.btnPrimary}
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? 'Publishing...' : <><Eye size={15} /> Publish Results</>}
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={`${styles.table} ${rs.gradebookTable}`}>
                <thead>
                  <tr>
                    <th>Adm. No.</th>
                    <th>Student Name</th>
                    <th>CA1 <small>/20</small></th>
                    <th>CA2 <small>/20</small></th>
                    <th>Exam <small>/60</small></th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {gradebook.map(row => {
                    const ca1  = parseFloat(row.ca1)  || 0
                    const ca2  = parseFloat(row.ca2)  || 0
                    const exam = parseFloat(row.exam) || 0
                    const total = ca1 + ca2 + exam
                    const isDirty = row.ca1 !== '' || row.ca2 !== '' || row.exam !== ''

                    return (
                      <tr key={row.student_id} className={row.result_id ? rs.hasResult : ''}>
                        <td><code>{row.admission_number}</code></td>
                        <td><strong>{row.last_name} {row.first_name}</strong></td>
                        <td>
                          <input
                            className={rs.scoreInput}
                            type="number" min="0" max="20" step="0.5"
                            value={row.ca1}
                            onChange={e => updateRow(row.student_id, 'ca1', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            className={rs.scoreInput}
                            type="number" min="0" max="20" step="0.5"
                            value={row.ca2}
                            onChange={e => updateRow(row.student_id, 'ca2', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            className={rs.scoreInput}
                            type="number" min="0" max="60" step="0.5"
                            value={row.exam}
                            onChange={e => updateRow(row.student_id, 'exam', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <strong className={total > 0 ? rs.totalVal : ''}>
                            {total > 0 ? total.toFixed(1) : row.total || '—'}
                          </strong>
                        </td>
                        <td>
                          <span className={`${rs.gradeBadge} ${getGradeColor(row.grade)}`}>
                            {row.grade || '—'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={rs.saveBtn}
                            onClick={() => saveRow(row)}
                            disabled={!!saving[row.student_id]}
                            title="Save this row"
                          >
                            {saving[row.student_id]
                              ? <span className={rs.savingDot} />
                              : row.result_id ? <Check size={14} color="#4ade80" /> : <Save size={14} />
                            }
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
