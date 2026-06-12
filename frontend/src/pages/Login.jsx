import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, School, BookOpen, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import styles from './Auth.module.css'

const roles = [
  { key: 'school', label: 'School Admin', icon: School },
  { key: 'teacher', label: 'Teacher',     icon: BookOpen },
  { key: 'super',   label: 'Super Admin', icon: Shield },
]

export default function Login() {
  const { login } = useAuth()
  const { post }  = useApi()
  const navigate  = useNavigate()
  const [role,    setRole]   = useState('school')
  const [form,    setForm]   = useState({ email: '', username: '', password: '' })
  const [showPw,  setShowPw] = useState(false)
  const [loading, setLoading]= useState(false)
  const [errors,  setErrors] = useState([])

  const isTeacher = role === 'teacher'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = []
    if (isTeacher && !form.username) errs.push('Username is required.')
    if (!isTeacher && !form.email)   errs.push('Email is required.')
    if (!form.password)              errs.push('Password is required.')
    if (errs.length) { setErrors(errs); return }

    setErrors([]); setLoading(true)
    try {
      const payload = isTeacher
        ? { username: form.username.trim(), password: form.password, login_type: 'username' }
        : { email:    form.email.trim(),    password: form.password, login_type: 'email' }

      const res = await post('/auth/login', payload)
      login(res.data)

      if (res.data.user.role === 'super_admin') navigate('/super')
      else if (res.data.user.role === 'teacher') navigate('/teacher')
      else if (!res.data.school?.onboarded) navigate('/admin/onboarding')
      else navigate('/admin')
    } catch (e) {
      setErrors([e.message])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.miniNav}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoImgWrap}>
            <img src="/logo.png" alt="Exclusive Grades" className={styles.logoImg} />
          </div>
          Exclusive<span>Grades</span>
        </Link>
        <Link to="/register" className={styles.navLink}>
          <span className={styles.hideOnMobile}>No account? </span><b>Register free</b>
        </Link>
      </nav>

      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <h1>Welcome back</h1>
            <p>Log in to your Exclusive Grades account.</p>
          </div>

          <div className={styles.roleTabs}>
            {roles.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={role === key ? styles.roleActive : ''}
                onClick={() => { setRole(key); setErrors([]) }}
              >
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
            {isTeacher ? (
              <div className={styles.field}>
                <label>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. schoolname_john.doe"
                  autoComplete="username"
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                  Your username was provided by your school admin.
                </span>
              </div>
            ) : (
              <div className={styles.field}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@school.com"
                  autoComplete="email"
                />
              </div>
            )}

            <div className={styles.field}>
              <label>
                Password
                <a href="#" className={styles.forgot}>Forgot password?</a>
              </label>
              <div className={styles.pwWrap}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={isTeacher ? 'Default: your school name' : 'Your password'}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Logging in...' : <> Log In <ArrowRight size={16} /></>}
            </button>
          </form>

          {!isTeacher && (
            <p className={styles.switchLink}>
              Don't have an account? <Link to="/register">Register your school</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
