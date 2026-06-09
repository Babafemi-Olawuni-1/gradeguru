import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import styles from './Auth.module.css'

export default function Register() {
  const navigate  = useNavigate()
  const { post }  = useApi()
  const [form,    setForm]    = useState({ first_name: '', last_name: '', school_name: '', slug: '', email: '', password: '', confirm: '' })
  const [errors,  setErrors]  = useState([])
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'school_name' && !prev.slug) next.slug = autoSlug(value)
      if (name === 'slug') next.slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
      return next
    })
  }

  const validate = () => {
    const errs = []
    if (!form.first_name.trim())  errs.push('First name is required.')
    if (!form.last_name.trim())   errs.push('Last name is required.')
    if (!form.school_name.trim()) errs.push('School name is required.')
    if (!/^[a-z0-9-]{3,50}$/.test(form.slug)) errs.push('URL slug must be 3–50 lowercase letters, numbers, or hyphens.')
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.push('A valid email address is required.')
    if (form.password.length < 8) errs.push('Password must be at least 8 characters.')
    if (form.password !== form.confirm) errs.push('Passwords do not match.')
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (errs.length) { setErrors(errs); return }
    setErrors([]); setLoading(true)
    try {
      await post('/auth/register', {
        first_name:  form.first_name,
        last_name:   form.last_name,
        school_name: form.school_name,
        slug:        form.slug,
        email:       form.email,
        password:    form.password,
      })
      navigate('/login?registered=1&email=' + encodeURIComponent(form.email))
    } catch (err) {
      setErrors([err.message])
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
        <Link to="/login" className={styles.navLink}>
          <span className={styles.hideOnMobile}>Already have an account? </span><b>Log in</b>
        </Link>
      </nav>

      <div className={styles.container}>
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <h1>Register Your School</h1>
            <p>Get your school online in minutes. Free to start — no credit card needed.</p>
          </div>

          {errors.length > 0 && (
            <div className={styles.alertError}>
              <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label>First Name</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="John" />
              </div>
              <div className={styles.field}>
                <label>Last Name</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" />
              </div>
            </div>
            <div className={styles.field}>
              <label>School Name</label>
              <input name="school_name" value={form.school_name} onChange={handleChange} placeholder="e.g. Greenfield Academy" />
            </div>
            <div className={styles.field}>
              <label>School URL Slug</label>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. greenfield-academy" />
              <span className={styles.slugPreview}>exclusivegrade.com/<b>{form.slug || 'yourschool'}</b></span>
            </div>
            <div className={styles.field}>
              <label>Admin Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@yourschool.com" />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.pwWrap}>
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat your password" />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Creating account...' : <> Create School Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className={styles.switchLink}>Already have an account? <Link to="/login">Log in here</Link></p>
        </div>
      </div>
    </div>
  )
}
