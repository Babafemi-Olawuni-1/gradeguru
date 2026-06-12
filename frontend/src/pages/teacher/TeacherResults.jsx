import { useState, useEffect, useCallback } from 'react'
import { Save, Check, FileText } from 'lucide-react'
import TeacherLayout from './TeacherLayout'
import { useApi } from '../../hooks/useApi'
import styles from '../admin/AdminPage.module.css'
import rs from '../admin/Results.module.css'

export default function TeacherResults() {
  const { get, post } = useApi()
  const [classes,   setClasses]   = useState([])
  const [subjects,  setSubjects]  = useState([])
  const [classId,   setClassId]   = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [termId,    setTermId]    = useState('')
  const [gradebook, setGradebook] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState({})
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  useEffect(() => {
    Promise.all([get('/classes'), get('/subjects')]).then(([cr, sr]) => {
      setClasses(cr.data || [])
      setSubjects(sr.data || [])
    }).catch(() => {})
  }, [get])

  const loadGradebook = useCallback(async () => {
    if (!classId || !subjectId || !termId) return
    setLoading(true); setError('')
    try {
      const res = await get(`/results?class_id=${classId}&subject_id=${subjectId}&term_id=${termId}`)
      const { results, students } = res.data
      const merged = students.map(st => {
        const r = results.find(r => r.student_id === st.id) || null
        return {
          student_id: st.id,
          first_name: st.first_name,
          last_name:  st.last_name,
          admission_number: st.admission_number,
          result_id:  r?.id    || null,
          ca1:  r?.ca1  ?? '',
          ca2:  r?.ca2  ?? '',
          exam: r?.exam ?? '',
          total: r?.total ?? '',
          grade: r?.grade ?? '',
        }
      })
      setGradebook(merged)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [classId, subjectId, termId, get])

  useEffect(() => { loadGradebook() }, [loadGradebook])

  const updateRow = (studentId, field, value) =>
    setGradebook(prev => prev.map(r => r.student_id === studentId ? { ...r, [field]: value } : r))

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
      setSuccess('Saved.'); setTimeout(() => setSuccess(''), 2000)
    } catch (e) { setError(e.message) }
    finally { setSaving(prev => ({ ...prev, [row.student_id]: false })) }
  }

  const getGradeColor = (g) => {
    if (!g) return ''
    if (['A1','B2','B3'].includes(g)) return rs.gradeA
    if (['C4','C5','C6'].includes(g)) return rs.gradeB
    if (['D7','E8'].includes(g))      return rs.gradeC
    return rs.gradeF
  }

  return (
    <TeacherLayout title="Enter Results">
      <div className={rs.page}>
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
              type="number" min="1" placeholder="e.g. 1"
              value={termId}
              onChange={e => { setTermId(e.target.value); setGradebook([]) }}
              style={{ width: 100 }}
            />
          </div>
          <button className={styles.btnOutline} onClick={loadGradebook} disabled={!classId || !subjectId || !termId || loading}>
            {loading ? 'Loading...' : 'Load'}
          </button>
        </div>

        {error   && <div className={styles.formError}  style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className={rs.successMsg}>{success}</div>}

        {!classId && !subjectId && (
          <div className={rs.emptyState}><FileText size={40} /><p>Select class, subject and term to enter results.</p></div>
        )}

        {classId && subjectId && termId && !loading && gradebook.length === 0 && (
          <div className={rs.emptyState}><FileText size={40} /><p>No students in this class.</p></div>
        )}

        {gradebook.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${rs.gradebookTable}`}>
              <thead>
                <tr>
                  <th>Adm. No.</th>
                  <th>Name</th>
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
                  return (
                    <tr key={row.student_id} className={row.result_id ? rs.hasResult : ''}>
                      <td><code>{row.admission_number}</code></td>
                      <td><strong>{row.last_name} {row.first_name}</strong></td>
                      <td><input className={rs.scoreInput} type="number" min="0" max="20" step="0.5" value={row.ca1} onChange={e => updateRow(row.student_id, 'ca1', e.target.value)} placeholder="0" /></td>
                      <td><input className={rs.scoreInput} type="number" min="0" max="20" step="0.5" value={row.ca2} onChange={e => updateRow(row.student_id, 'ca2', e.target.value)} placeholder="0" /></td>
                      <td><input className={rs.scoreInput} type="number" min="0" max="60" step="0.5" value={row.exam} onChange={e => updateRow(row.student_id, 'exam', e.target.value)} placeholder="0" /></td>
                      <td><strong className={total > 0 ? rs.totalVal : ''}>{total > 0 ? total.toFixed(1) : row.total || '—'}</strong></td>
                      <td><span className={`${rs.gradeBadge} ${getGradeColor(row.grade)}`}>{row.grade || '—'}</span></td>
                      <td>
                        <button className={rs.saveBtn} onClick={() => saveRow(row)} disabled={!!saving[row.student_id]}>
                          {saving[row.student_id] ? <span className={rs.savingDot} /> : row.result_id ? <Check size={14} color="#4ade80" /> : <Save size={14} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TeacherLayout>
  )
}
