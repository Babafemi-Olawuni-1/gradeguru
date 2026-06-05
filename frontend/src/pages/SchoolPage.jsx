import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Phone, Mail, MapPin, Key, ArrowRight, GraduationCap,
  CheckCircle, ChevronLeft, ChevronRight, Menu, X, Send
} from 'lucide-react'
import styles from './SchoolPage.module.css'
import { resolveUrl } from '../utils/resolveUrl'
import { API_BASE_URL } from '../config'

export default function SchoolPage() {
  const { slug } = useParams()
  const [school,        setSchool]        = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [navOpen,       setNavOpen]       = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  // Carousel
  const [slide, setSlide] = useState(0)
  const slideTimer = useRef(null)

  // Parse gallery from school data
  const getGallery = (s) => {
    if (!s?.gallery) return []
    try {
      const arr = typeof s.gallery === 'string' ? JSON.parse(s.gallery) : s.gallery
      return Array.isArray(arr) ? arr.map(resolveUrl).filter(Boolean) : []
    }
    catch { return [] }
  }

  // Result checker
  const [pin,      setPin]      = useState('')
  const [admNo,    setAdmNo]    = useState('')
  const [checking, setChecking] = useState(false)
  const [result,   setResult]   = useState(null)
  const [checkErr, setCheckErr] = useState('')

  // Contact form
  const [contact,      setContact]      = useState({ name: '', email: '', message: '' })
  const [contactSent,  setContactSent]  = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/school/public?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setNotFound(true); return }
        setSchool(d.data.school)
        setAnnouncements(d.data.announcements || [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Set page title dynamically
  useEffect(() => {
    if (school?.name) {
      document.title = `${school.name} - GradeGuru`
    }
    return () => { document.title = 'GradeGuru – School Management Platform' }
  }, [school])

  // Auto-advance carousel
  const images = getGallery(school)
  const heroImages = images.length > 0 ? images : [null]

  useEffect(() => {
    if (heroImages.length <= 1) return
    slideTimer.current = setInterval(() => setSlide(s => (s + 1) % heroImages.length), 5000)
    return () => clearInterval(slideTimer.current)
  }, [heroImages.length])

  const prevSlide = () => { clearInterval(slideTimer.current); setSlide(s => (s - 1 + heroImages.length) % heroImages.length) }
  const nextSlide = () => { clearInterval(slideTimer.current); setSlide(s => (s + 1) % heroImages.length) }

  // Scroll spy
  useEffect(() => {
    const sections = ['home', 'about', 'result', 'contact']
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
    }, { threshold: 0.4 })
    sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [school])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setNavOpen(false)
  }

  const handleCheck = async (e) => {
    e.preventDefault()
    setChecking(true); setCheckErr(''); setResult(null)
    try {
      const res  = await fetch(`${API_BASE_URL}/pins/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, pin_code: pin.trim().toUpperCase(), admission_number: admNo.trim() })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setResult(data.data)
    } catch (err) { setCheckErr(err.message) }
    finally { setChecking(false) }
  }

  if (loading) return (
    <div className={styles.loadingPage}>
      <div className={styles.spinner} />
      <p>Loading...</p>
    </div>
  )

  if (notFound) return (
    <div className={styles.notFound}>
      <GraduationCap size={64} />
      <h1>School not found</h1>
      <p>No active school at <code>gradeguru.atayesefm.com.ng/s/{slug}</code></p>
      <Link to="/">Back to GradeGuru</Link>
    </div>
  )

  const color   = school.primary_color || '#7c3aed'
  const navLinks = [
    { id: 'home',   label: 'Home' },
    { id: 'about',  label: 'About' },
    { id: 'result', label: 'Check Result' },
    { id: 'contact',label: 'Contact' },
  ]

  return (
    <div className={styles.page}>

      {/* ── NAVBAR ── */}
      <nav className={styles.navbar} style={{ borderBottom: `3px solid ${color}` }}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            {school.logo_url
              ? <img src={resolveUrl(school.logo_url)} alt={school.name} className={styles.navLogo} />
              : <div className={styles.navLogoPlaceholder} style={{ background: color }}>{school.name[0]}</div>
            }
            <span className={styles.navName}>{school.name}</span>
          </div>

          <div className={`${styles.navLinks} ${navOpen ? styles.navOpen : ''}`}>
            {navLinks.map(l => (
              <button
                key={l.id}
                className={`${styles.navLink} ${activeSection === l.id ? styles.navLinkActive : ''}`}
                style={activeSection === l.id ? { color, borderBottomColor: color } : {}}
                onClick={() => scrollTo(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            className={styles.checkResultBtn}
            style={{ background: color }}
            onClick={() => scrollTo('result')}
          >
            <Key size={15} /> Check Result
          </button>

          <button className={styles.hamburger} onClick={() => setNavOpen(!navOpen)}>
            {navOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── HERO / CAROUSEL ── */}
      <section id="home" className={styles.hero}>
        {/* Slides */}
        <div className={styles.slides}>
          {heroImages.map((img, i) => (
            <div
              key={i}
              className={`${styles.slide} ${i === slide ? styles.slideActive : ''}`}
              style={img
                ? { backgroundImage: `url(${img})` }
                : { background: `linear-gradient(135deg, ${color}22 0%, #050a1f 100%)` }
              }
            />
          ))}
          {/* Dark overlay */}
          <div className={styles.slideOverlay} />
        </div>

        {/* Carousel controls */}
        {heroImages.length > 1 && (
          <>
            <button className={`${styles.slideBtn} ${styles.slidePrev}`} onClick={prevSlide}><ChevronLeft size={24} /></button>
            <button className={`${styles.slideBtn} ${styles.slideNext}`} onClick={nextSlide}><ChevronRight size={24} /></button>
            <div className={styles.slideDots}>
              {heroImages.map((_, i) => (
                <button key={i} className={`${styles.dot} ${i === slide ? styles.dotActive : ''}`}
                  style={i === slide ? { background: color } : {}}
                  onClick={() => setSlide(i)} />
              ))}
            </div>
          </>
        )}

        {/* Hero content */}
        <div className={styles.heroContent}>
          {school.logo_url && <img src={resolveUrl(school.logo_url)} alt={school.name} className={styles.heroLogo} />}
          <h1 className={styles.heroTitle}>{school.name}</h1>
          <p className={styles.heroSub}>{school.welcome_text || 'Excellence in Education'}</p>
          <div className={styles.heroActions}>
            <button className={styles.heroBtnPrimary} style={{ background: color }} onClick={() => scrollTo('result')}>
              <Key size={16} /> Check Result
            </button>
            <button className={styles.heroBtnOutline} onClick={() => scrollTo('about')}>
              Learn More <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS TICKER ── */}
      {announcements.length > 0 && (
        <div className={styles.ticker} style={{ background: color }}>
          <span className={styles.tickerLabel}>News</span>
          <div className={styles.tickerTrack}>
            <div className={styles.tickerInner}>
              {[...announcements, ...announcements].map((a, i) => (
                <span key={i} className={styles.tickerItem}>{a.title}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ABOUT ── */}
      <section id="about" className={styles.about}>
        <div className={styles.container}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutText}>
              <span className={styles.sectionLabel} style={{ color }}>About Us</span>
              <h2>{school.name}</h2>
              {school.motto && (
                <p className={styles.motto} style={{ borderLeftColor: color }}>"{school.motto}"</p>
              )}
              <p className={styles.aboutDesc}>
                {school.about || school.welcome_text || `Welcome to ${school.name}. We are committed to providing quality education and nurturing the next generation of leaders.`}
              </p>
              {(school.school_type || school.founded_year || school.founder_name) && (
                <div className={styles.schoolMeta}>
                  {school.school_type  && <div className={styles.metaItem}><strong>Type</strong><span>{school.school_type}</span></div>}
                  {school.founded_year && <div className={styles.metaItem}><strong>Founded</strong><span>{school.founded_year}</span></div>}
                  {school.founder_name && <div className={styles.metaItem}><strong>Founder</strong><span>{school.founder_name}</span></div>}
                </div>
              )}
              <div className={styles.contactCards}>
                {school.phone   && <div className={styles.contactCard}><Phone size={15} style={{ color, flexShrink: 0 }} /><span>{school.phone}</span></div>}
                {school.email   && <div className={styles.contactCard}><Mail size={15} style={{ color, flexShrink: 0 }} /><span>{school.email}</span></div>}
                {school.address && <div className={styles.contactCard}><MapPin size={15} style={{ color, flexShrink: 0 }} /><span>{school.address}</span></div>}
              </div>
            </div>
            <div className={styles.aboutStats}>
              {[
                { num: school.plan === 'enterprise' ? '∞' : school.plan === 'pro' ? '200+' : '5+', label: 'Students' },
                { num: school.plan === 'enterprise' ? '∞' : school.plan === 'pro' ? '10+' : '2+',  label: 'Teachers' },
                { num: school.founded_year ? `Est. ${school.founded_year}` : '3', label: school.founded_year ? 'Year' : 'Terms/Year' },
                { num: '100%', label: 'Dedication' },
              ].map(s => (
                <div key={s.label} className={styles.statBox} style={{ borderTop: `3px solid ${color}` }}>
                  <span style={{ color }}>{s.num}</span>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className={styles.announcementsBlock}>
              <h3>Latest Announcements</h3>
              <div className={styles.announcementCards}>
                {announcements.slice(0, 3).map(a => (
                  <div key={a.id} className={styles.announcementCard} style={{ borderLeft: `4px solid ${color}` }}>
                    <h4>{a.title}</h4>
                    <p>{a.body}</p>
                    <span>{new Date(a.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── RESULT CHECKER ── */}
      <section id="result" className={styles.resultSection} style={{ background: `${color}0d` }}>
        <div className={styles.container}>
          <div className={styles.resultInner}>
            <div className={styles.resultLeft}>
              <span className={styles.sectionLabel} style={{ color }}>Result Checker</span>
              <h2>Check Your Result</h2>
              <p>Enter your PIN and admission number to instantly view your academic result.</p>
              <div className={styles.howItWorks}>
                {['Get your PIN from the school', 'Enter your admission number', 'View and download your result'].map((s, i) => (
                  <div key={i} className={styles.howStep}>
                    <div className={styles.howNum} style={{ background: color }}>{i + 1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.checkerCard}>
              {!result ? (
                <form onSubmit={handleCheck}>
                  <h3>Enter Your Details</h3>
                  {checkErr && <div className={styles.checkError}>{checkErr}</div>}
                  <div className={styles.field}>
                    <label>PIN Code</label>
                    <input value={pin} onChange={e => setPin(e.target.value)} placeholder="e.g. GG-ABC123-DEF456" required />
                  </div>
                  <div className={styles.field}>
                    <label>Admission Number</label>
                    <input value={admNo} onChange={e => setAdmNo(e.target.value)} placeholder="e.g. GF/2024/001" required />
                  </div>
                  <button type="submit" className={styles.checkBtn} style={{ background: color }} disabled={checking}>
                    {checking ? 'Checking...' : <> View Result <ArrowRight size={16} /></>}
                  </button>
                </form>
              ) : (
                <div className={styles.resultView}>
                  <div className={styles.resultTop}>
                    <CheckCircle size={22} color="#16a34a" />
                    <div>
                      <h4>{result.student.name}</h4>
                      <p>{result.student.class} &middot; {result.term} &middot; {result.session}</p>
                    </div>
                  </div>
                  <div className={styles.resultTableWrap}>
                    <table className={styles.resultTable}>
                      <thead><tr><th>Subject</th><th>CA1</th><th>CA2</th><th>Exam</th><th>Total</th><th>Grade</th><th>Remark</th></tr></thead>
                      <tbody>
                        {result.results.map((r, i) => (
                          <tr key={i}>
                            <td>{r.subject}</td>
                            <td>{r.ca1}</td><td>{r.ca2}</td><td>{r.exam}</td>
                            <td><strong>{r.total}</strong></td>
                            <td><span className={styles.grade} style={{ background: `${color}18`, color }}>{r.grade}</span></td>
                            <td>{r.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.resultFooter}>
                    <span>Average: <strong>{result.average}%</strong></span>
                    <button onClick={() => { setResult(null); setPin(''); setAdmNo('') }} className={styles.checkAgain}>
                      Check Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div>
              <span className={styles.sectionLabel} style={{ color }}>Get In Touch</span>
              <h2>Contact {school.name}</h2>
              <p>Have a question or need more information? Reach out to us.</p>
              <div className={styles.contactInfoList}>
                {school.phone   && <div className={styles.contactInfoItem}><div className={styles.contactIcon} style={{ background: `${color}18`, color }}><Phone size={18} /></div><div><strong>Phone</strong><span>{school.phone}</span></div></div>}
                {school.email   && <div className={styles.contactInfoItem}><div className={styles.contactIcon} style={{ background: `${color}18`, color }}><Mail size={18} /></div><div><strong>Email</strong><span>{school.email}</span></div></div>}
                {school.address && <div className={styles.contactInfoItem}><div className={styles.contactIcon} style={{ background: `${color}18`, color }}><MapPin size={18} /></div><div><strong>Address</strong><span>{school.address}</span></div></div>}
              </div>
            </div>

            <div className={styles.contactFormCard}>
              {contactSent ? (
                <div className={styles.contactSent}>
                  <CheckCircle size={40} color="#16a34a" />
                  <h4>Message sent!</h4>
                  <p>The school will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); setContactSent(true) }}>
                  <div className={styles.field}><label>Your Name</label><input required value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} placeholder="Full name" /></div>
                  <div className={styles.field}><label>Email</label><input type="email" required value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} placeholder="your@email.com" /></div>
                  <div className={styles.field}><label>Message</label><textarea rows={4} required value={contact.message} onChange={e => setContact({ ...contact, message: e.target.value })} placeholder="Your message..." /></div>
                  <button type="submit" className={styles.checkBtn} style={{ background: color }}>
                    <Send size={15} /> Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer} style={{ borderTop: `3px solid ${color}` }}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            {school.logo_url
              ? <img src={resolveUrl(school.logo_url)} alt={school.name} className={styles.footerLogo} />
              : <div className={styles.footerLogoPlaceholder} style={{ background: color }}>{school.name[0]}</div>
            }
            <span>{school.name}</span>
          </div>
          <div className={styles.footerLinks}>
            {navLinks.map(l => <button key={l.id} onClick={() => scrollTo(l.id)}>{l.label}</button>)}
          </div>
          <p className={styles.poweredBy}>
            Powered by <Link to="/" target="_blank">GradeGuru</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
