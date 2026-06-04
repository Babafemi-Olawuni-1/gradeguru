import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, Menu, X } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location])

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <GraduationCap size={26} strokeWidth={2.5} />
        Grade<span>Guru</span>
      </Link>

      <div className={`${styles.links} ${open ? styles.open : ''}`}>
        <a href="/#features" onClick={() => setOpen(false)}>Features</a>
        <a href="/#how-it-works" onClick={() => setOpen(false)}>How It Works</a>
        <a href="/#pricing" onClick={() => setOpen(false)}>Pricing</a>
        <a href="/#testimonials" onClick={() => setOpen(false)}>Reviews</a>
      </div>

      <div className={styles.cta}>
        <Link to="/login" className={styles.btnOutline}>Log In</Link>
        <Link to="/register" className={styles.btnPrimary}>Get Started Free</Link>
      </div>

      <button className={styles.hamburger} onClick={() => setOpen(!open)} aria-label="Toggle menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
    </nav>
  )
}
