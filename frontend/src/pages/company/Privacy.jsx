import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Page.module.css'

const sections = [
  { title: '1. Information We Collect', body: 'We collect information you provide when registering a school, including school name, admin email, and password (stored as a bcrypt hash). We also collect student data (name, admission number, class) uploaded by school administrators, and usage data such as PIN generation logs and result access timestamps.' },
  { title: '2. How We Use Your Information', body: 'We use collected information to operate the Exclusive Grades platform, process PIN purchases and wallet transactions, send account confirmation and notification emails, and provide school administrators with analytics on PIN usage and result access.' },
  { title: '3. Data Sharing', body: 'We do not sell, trade, or rent your personal information to third parties. We may share data with payment processors (Paystack, Flutterwave) solely to process wallet top-ups and subscription payments. These processors are bound by their own privacy policies.' },
  { title: '4. Student Data', body: 'Student data is owned by the school that uploaded it. Exclusive Grades acts as a data processor on behalf of the school. When a result is accessed via PIN, only the student\'s name, class, term, and result scores are displayed — no other personal data is exposed.' },
  { title: '5. Data Security', body: 'All passwords are stored as bcrypt hashes with a minimum cost factor of 12. All database interactions use parameterized queries to prevent SQL injection. All data is transmitted over HTTPS. Uploaded files are served through authenticated URLs, not publicly guessable paths.' },
  { title: '6. Data Retention', body: 'School data is retained for as long as the school account is active. When a school account is deleted, data is archived for 30 days before permanent deletion. You may request deletion of your data at any time by contacting support.' },
  { title: '7. Your Rights', body: 'You have the right to access, correct, or delete your personal data. School administrators can manage student records directly from their dashboard. For account-level data requests, contact us at privacy@Exclusive Grades.com.' },
  { title: '8. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify registered school administrators by email of any material changes. Continued use of the platform after changes constitutes acceptance of the updated policy.' },
]

export default function Privacy() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Legal</span>
          <h1>Privacy Policy</h1>
          <p>Last updated: January 2025. This policy explains how Exclusive Grades collects, uses, and protects your information.</p>
        </div>
        <div className={styles.section}>
          <div className={styles.docWrap}>
            {sections.map(s => (
              <div key={s.title} className={styles.docSection}>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

