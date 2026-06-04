import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <GraduationCap size={22} />
            Grade<span>Guru</span>
          </div>
          <p>The all-in-one school management platform built for African schools. Manage results, generate PINs, and grow with confidence.</p>
        </div>
        <div className={styles.col}>
          <h4>Platform</h4>
          <ul>
            <li><a href="/#features">Features</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="/#how-it-works">How It Works</a></li>
            <li><Link to="/register">Register School</Link></li>
          </ul>
        </div>
        <div className={styles.col}>
          <h4>Resources</h4>
          <ul>
            <li><Link to="/docs">Documentation</Link></li>
            <li><Link to="/csv-templates">CSV Templates</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/docs">API Reference</Link></li>
          </ul>
        </div>
        <div className={styles.col}>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} GradeGuru. All rights reserved.</p>
        <p>Built for schools across Africa</p>
      </div>
    </footer>
  )
}
