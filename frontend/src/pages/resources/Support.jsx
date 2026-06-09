import { useState } from 'react'
import { ChevronDown, ChevronUp, Mail, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Resources.module.css'

const faqs = [
  { q: 'How do I register my school?', a: 'Click "Get Started Free" on the homepage, fill in your school name, choose a URL slug, and create your admin account. Your school page will be live immediately.' },
  { q: 'How does the PIN system work?', a: 'You fund your school wallet, then generate PINs for a class and term. Each PIN is unique and single-use. Parents enter the PIN along with the student\'s admission number on your school\'s result checker page to view results.' },
  { q: 'Can I import students in bulk?', a: 'Yes. Download the student CSV template from the CSV Templates page, fill it in, and upload it from your admin dashboard under Students > Bulk Import.' },
  { q: 'What happens when my Starter plan limit is reached?', a: 'When you reach 5 students or 2 teachers on the Starter plan, you\'ll be prompted to upgrade to Pro. Existing data is not affected.' },
  { q: 'How do I upgrade my plan?', a: 'Go to your admin dashboard, click Settings > Subscription, and choose your new plan. Payment is processed via Paystack or Flutterwave.' },
  { q: 'Can parents download result PDFs?', a: 'Yes, if you enable PDF downloads in your school settings. Parents will see a download button after viewing results.' },
  { q: 'How do AI lesson notes work?', a: 'Available on Pro and Enterprise plans. Go to Tools > AI Lesson Notes, enter a topic and class level, and the AI generates a complete WASSCE-aligned lesson note within 30 seconds.' },
  { q: 'What if I need more students than my plan allows?', a: 'You can purchase Extra Student add-ons at $0.50 per student per month, or upgrade to a higher plan.' },
  { q: 'Is my school\'s data secure?', a: 'Yes. All passwords are bcrypt-hashed, all database queries use parameterized statements, and all data is transmitted over HTTPS. Student data is only accessible via valid PINs.' },
  { q: 'How do I connect a custom domain?', a: 'Custom domains are available on the Enterprise plan and as an add-on for Pro. Go to Settings > Custom Domain and follow the DNS configuration instructions.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
      <button onClick={() => setOpen(!open)}>
        <span>{q}</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <p>{a}</p>}
    </div>
  )
}

export default function Support() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Help Center</span>
          <h1>Support</h1>
          <p>Find answers to common questions or reach out to our team directly.</p>
        </div>

        <div className={styles.section}>
          <div className={styles.supportGrid}>
            <div>
              <h2 style={{marginBottom:'1.5rem', fontSize:'1.5rem', fontWeight:800}}>Frequently Asked Questions</h2>
              <div className={styles.faqList}>
                {faqs.map(f => <FaqItem key={f.q} {...f} />)}
              </div>
            </div>

            <div className={styles.supportSidebar}>
              <h3>Still need help?</h3>
              <p>Our support team is available Monday–Friday, 9am–6pm WAT.</p>
              <div className={styles.supportOptions}>
                <Link to="/contact" className={styles.supportOption}>
                  <Mail size={20} />
                  <div><strong>Email Support</strong><span>hello@ExclusiveGrade.com</span></div>
                </Link>
                <Link to="/contact" className={styles.supportOption}>
                  <MessageSquare size={20} />
                  <div><strong>Live Chat</strong><span>Available on Pro & Enterprise</span></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
