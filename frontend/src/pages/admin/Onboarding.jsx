import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import {
  GraduationCap, School, Users, BookOpen, Key, Wallet,
  CheckCircle, ArrowRight, ArrowLeft, Upload, Plus, X
} from 'lucide-react'
import styles from './Onboarding.module.css'

const STEPS = [
  { id: 'welcome',  title: 'Welcome to GradeGuru',   icon: GraduationCap },
  { id: 'school',   title: 'Set Up Your School',      icon: School },
  { id: 'class',    title: 'Create Your First Class', icon: BookOpen },
  { id: 'students', title: 'Add Students',            icon: Users },
  { id: 'pins',     title: 'How PINs Work',           icon: Key },
  { id: 'done',     title: "You're Ready!",           icon: CheckCircle },
]

export default function Onboarding() {
  const { school, user, updateSchool } = useAuth()
  const { post, put } = useApi()
  const navigate = useNavigate()

  const [step,    setStep]    = useState(0)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Step data
  const [schoolForm, setSchoolForm] = useState({
    welcome_text: school?.welcome_text || '',
    phone:        school?.phone || '',
    address:      school?.address || '',
  })
  const [className,  setClassName]  = useState('')
  const [classCreated, setClassCreated] = useState(false)
  const [students,   setStudents]   = useState([
    { first_name: '', last_name: '', admission_number: '', date_of_birth: '' }
  ])
  const [studentsAdded, setStudentsAdded] = useState(false)

  const next = () => { setError(''); setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const saveSchool = async () => {
    setSaving(true); setError('')
    try {
      const res = await put('/school', schoolForm)
      updateSchool({ ...school, ...schoolForm })
      next()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const saveClass = async () => {
    if (!className.trim()) { setError('Class name is required'); return }
    setSaving(true); setError('')
    try {
      await post('/classes', { name: className.trim() })
      setClassCreated(true)
      next()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const addStudentRow = () => setStudents(s => [...s, { first_name: '', last_name: '', admission_number: '', date_of_birth: '' }])
  const removeStudentRow = (i) => setStudents(s => s.filter((_, idx) => idx !== i))
  const updateStudent = (i, field, val) => setStudents(s => s.map((st, idx) => idx === i ? { ...st, [field]: val } : st))

  const saveStudents = async () => {
    const valid = students.filter(s => s.first_name && s.last_name && s.admission_number)
    if (!valid.length) { setError('Add at least one student with name and admission number'); return }
    setSaving(true); setError('')
    try {
      for (const s of valid) await post('/students', s)
      setStudentsAdded(true)
      next()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const finish = async () => {
    // Mark onboarded on the server so any device knows setup is done
    try { await put('/school', { onboarded: 1 }) } catch (_) {}
    localStorage.setItem('gg_onboarded', '1')
    navigate('/admin')
  }

  const current = STEPS[step]

  return (
    <div className={styles.page}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }} />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}><GraduationCap size={22} />Grade<span>Guru</span></div>
        <button className={styles.skipBtn} onClick={finish}>Skip setup</button>
      </div>

      {/* Step indicators */}
      <div className={styles.stepDots}>
        {STEPS.map((s, i) => (
          <div key={s.id} className={`${styles.dot} ${i < step ? styles.dotDone : ''} ${i === step ? styles.dotActive : ''}`}>
            {i < step ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <current.icon size={28} strokeWidth={1.8} />
        </div>
        <h2 className={styles.cardTitle}>{current.title}</h2>

        {error && <div className={styles.error}>{error}</div>}

        {/* ── STEP 0: Welcome ── */}
        {step === 0 && (
          <div className={styles.stepContent}>
            <p>Hi <strong>{user?.first_name}</strong>, welcome to GradeGuru! Let's get <strong>{school?.name}</strong> set up in just a few steps.</p>
            <div className={styles.featureList}>
              {[
                { icon: School,   text: 'Set up your school profile' },
                { icon: BookOpen, text: 'Create classes and subjects' },
                { icon: Users,    text: 'Add your students' },
                { icon: Key,      text: 'Generate PINs for result access' },
                { icon: Wallet,   text: 'Fund your wallet and go live' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className={styles.featureItem}>
                  <div className={styles.featureItemIcon}><Icon size={16} /></div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <p className={styles.timeNote}>This takes about 3 minutes.</p>
            <button className={styles.btnPrimary} onClick={next}>
              Let's Get Started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 1: School profile ── */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <p>Add your school's contact info so parents can reach you from your school page.</p>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Welcome Message</label>
                <textarea rows={3} value={schoolForm.welcome_text} onChange={e => setSchoolForm({ ...schoolForm, welcome_text: e.target.value })} placeholder="e.g. Welcome to Greenfield Academy — excellence in education." />
              </div>
              <div className={styles.field}>
                <label>Phone Number</label>
                <input value={schoolForm.phone} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} placeholder="+234 800 000 0000" />
              </div>
              <div className={styles.field}>
                <label>School Address</label>
                <input value={schoolForm.address} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} placeholder="123 School Road, Lagos" />
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnOutline} onClick={next}>Skip for now</button>
              <button className={styles.btnPrimary} onClick={saveSchool} disabled={saving}>
                {saving ? 'Saving...' : <>Save & Continue <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Create class ── */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <p>Classes organise your students. Create your first one — you can add more later.</p>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Class Name</label>
                <input value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. JSS1, SSS2A, Primary 4" />
              </div>
              <div className={styles.examples}>
                <span>Examples:</span>
                {['JSS1', 'JSS2', 'SSS1', 'SSS2', 'Primary 5'].map(c => (
                  <button key={c} type="button" className={styles.exampleChip} onClick={() => setClassName(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnOutline} onClick={next}>Skip for now</button>
              <button className={styles.btnPrimary} onClick={saveClass} disabled={saving}>
                {saving ? 'Creating...' : <>Create Class <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Add students ── */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <p>Add a few students to get started. You can import more via CSV from the Students page.</p>
            <div className={styles.studentTable}>
              <div className={styles.studentHeader}>
                <span>First Name</span><span>Last Name</span><span>Admission No.</span><span></span>
              </div>
              {students.map((s, i) => (
                <div key={i} className={styles.studentRow}>
                  <input placeholder="First name" value={s.first_name} onChange={e => updateStudent(i, 'first_name', e.target.value)} />
                  <input placeholder="Last name"  value={s.last_name}  onChange={e => updateStudent(i, 'last_name',  e.target.value)} />
                  <input placeholder="e.g. GF/001" value={s.admission_number} onChange={e => updateStudent(i, 'admission_number', e.target.value)} />
                  <button onClick={() => removeStudentRow(i)} disabled={students.length === 1}><X size={14} /></button>
                </div>
              ))}
              <button className={styles.addRowBtn} onClick={addStudentRow}><Plus size={14} /> Add another student</button>
            </div>
            <div className={styles.actions}>
              <button className={styles.btnOutline} onClick={next}>Skip for now</button>
              <button className={styles.btnPrimary} onClick={saveStudents} disabled={saving}>
                {saving ? 'Adding...' : <>Add Students <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: How PINs work ── */}
        {step === 4 && (
          <div className={styles.stepContent}>
            <p>PINs are how parents access student results. Here's how it works:</p>
            <div className={styles.pinSteps}>
              {[
                { num: '1', text: 'Fund your wallet from the Wallet page using Paystack.' },
                { num: '2', text: 'Go to PINs → Generate PINs. Choose a term and quantity.' },
                { num: '3', text: 'Each PIN costs ₦100 on the Starter plan (less on Pro/Enterprise).' },
                { num: '4', text: 'Give each parent their PIN. They visit your school page and enter it with the admission number.' },
                { num: '5', text: 'Results appear instantly — no login needed for parents.' },
              ].map(p => (
                <div key={p.num} className={styles.pinStep}>
                  <div className={styles.pinStepNum}>{p.num}</div>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={next}>
                Got it <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Done ── */}
        {step === 5 && (
          <div className={styles.stepContent}>
            <div className={styles.doneIcon}><CheckCircle size={64} color="#16a34a" /></div>
            <h3>Your school is ready!</h3>
            <p>Here's what you can do next from your dashboard:</p>
            <div className={styles.nextSteps}>
              {[
                { label: 'Upload results',    path: '/admin/results',  desc: 'Enter or import student scores' },
                { label: 'Fund your wallet',  path: '/admin/wallet',   desc: 'Top up to generate PINs' },
                { label: 'View school page',  path: `/s/${school?.slug}`, desc: 'See what parents see' },
              ].map(n => (
                <a key={n.label} href={n.path} className={styles.nextCard}>
                  <div>
                    <strong>{n.label}</strong>
                    <span>{n.desc}</span>
                  </div>
                  <ArrowRight size={16} />
                </a>
              ))}
            </div>
            <button className={styles.btnPrimary} onClick={finish} style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}>
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      {step > 0 && step < STEPS.length - 1 && (
        <button className={styles.backBtn} onClick={prev}>
          <ArrowLeft size={16} /> Back
        </button>
      )}
    </div>
  )
}
