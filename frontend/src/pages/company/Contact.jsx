import { useState } from 'react'
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Page.module.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState([])

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = []
    if (!form.name.trim()) errs.push('Name is required.')
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.push('Valid email is required.')
    if (!form.message.trim()) errs.push('Message is required.')
    if (errs.length) { setErrors(errs); return }
    setErrors([])
    setSent(true)
  }

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Get In Touch</span>
          <h1>Contact Us</h1>
          <p>Have a question, need help, or want to discuss an Enterprise plan? We're here for you.</p>
        </div>

        <div className={styles.section}>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <h2>We'd love to hear from you</h2>
              <p>Reach out through any of the channels below or fill in the form and we'll get back to you within 24 hours.</p>
              <div className={styles.contactItems}>
                {[
                  { icon: Mail,        label: 'Email',    value: 'hello@Exclusive Grades.com' },
                  { icon: Phone,       label: 'Phone',    value: '+234 800 000 0000' },
                  { icon: MapPin,      label: 'Location', value: 'Lagos, Nigeria' },
                  { icon: MessageSquare, label: 'Support', value: 'support@Exclusive Grades.com' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className={styles.contactItem}>
                    <div className={styles.contactIcon}><Icon size={18} strokeWidth={1.8} /></div>
                    <div>
                      <span>{label}</span>
                      <p>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.contactForm}>
              {sent ? (
                <div className={styles.sentState}>
                  <CheckCircle size={48} color="#4ade80" />
                  <h3>Message sent!</h3>
                  <p>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {errors.length > 0 && (
                    <div className={styles.alertError}>
                      <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                    </div>
                  )}
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label>Full Name</label>
                      <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" />
                    </div>
                    <div className={styles.field}>
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Subject</label>
                    <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="How can we help?" />
                  </div>
                  <div className={styles.field}>
                    <label>Message</label>
                    <textarea rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Tell us more..." />
                  </div>
                  <button type="submit" className={styles.submitBtn}>
                    Send Message <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

