import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, School, BookOpen, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import styles from './Auth.module.css'

const roles = [
  { key: 'school', label: 'School Admin', icon: School },
  { key: 'teacher', label: 'Teacher', icon: BookOpen },
  { key: 'super', label: 'Super Admin', icon: Shield },
]

export default function Login() {
  const { login } = useAuth()
  const { post }  = useApi()
  const navigate  = useNavigate()
  const [role,    setRole]   = useState('school')
  const [form,    setForm]   = useState({ email: '', password: '' })
  const [showPw,  setShowPw] = useState(false)
  const [loading, setLoading]= useState(false)
  const [errors,  setErrors] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = []
    if (!form.email) errs.push('Email is required.')
    if (!form.password) errs.push('Password is required.')
    if (errs.length) { setErrors(errs); return }
    setErrors([]); setLoading(true)
    try {
      const res = await post('/auth/login', { ...form, role })
      login(res.data)
      // Redirect based on role and server-side onboarded flag
      if (res.data.user.role === 'super_admin') navigate('/super')
      else if (res.data.user.role === 'teacher') navigate('/teacher')
      else if (!res.data.school?.onboarded) navigate('/admin/onboarding')
      else navigate('/admin')
    } catch(e) {
      setErrors([e.message])
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.miniNav}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoImgWrap}>
            <img src="/logo.png" alt="ExclusiveGrade" className={styles.logoImg} />
          </div>
          Exclusive<span>Grade</span>
        </Link>
        <Link to="/register" className={styles.navLink}>
          <span className={styles.hideOnMobile}>No account? </span><b>Register free</b>
        </Link>
      </nav>

      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <h1>Welcome back</h1>
            <p>Log in to your ExclusiveGrade account.</p>
          </div>

          <div className={styles.roleTabs}>
            {roles.map(({ key, label, icon: Icon }) => (
              <button key={key} className={role === key ? styles.roleActive : ''} onClick={() => setRole(key)}>
                <Icon size={15} />{label}
              </button>
            ))}
          </div>

          {errors.length > 0 && (
            <div className={styles.alertError}>
              <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@school.com" />
            </div>
            <div className={styles.field}>
              <label>
                Password
                <a href="#" className={styles.forgot}>Forgot password?</a>
              </label>
              <div className={styles.pwWrap}>
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
                <button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Logging in...' : <> Log In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className={styles.switchLink}>Don't have an account? <Link to="/register">Register your school</Link></p>
        </div>
      </div>
    </div>
  )
}
