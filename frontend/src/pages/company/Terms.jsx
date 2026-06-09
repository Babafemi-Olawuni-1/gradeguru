import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Page.module.css'

const sections = [
  { title: '1. Acceptance of Terms', body: 'By registering a school on ExclusiveGrade, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users including school administrators, teachers, and parents.' },
  { title: '2. Account Registration', body: 'You must provide accurate information when registering. Each school slug must be unique and may only contain lowercase letters, numbers, and hyphens. You are responsible for maintaining the security of your account credentials. ExclusiveGrade is not liable for losses resulting from unauthorized account access.' },
  { title: '3. Subscription Plans and Billing', body: 'ExclusiveGrade offers three plans: Starter (free), Pro ($15/month), and Enterprise ($50/month). Subscription fees are billed in advance. Annual plans are billed once per year. Downgrading to a lower plan takes effect at the end of the current billing period. Refunds are not provided for partial billing periods.' },
  { title: '4. PIN System and Wallet', body: 'PINs are purchased using your school wallet balance. PIN prices vary by plan: ₦100 (Starter), ₦80 (Pro), ₦50 (Enterprise). Bulk discounts apply for orders of 100+ PINs. Wallet credits are non-refundable once used to generate PINs. Unused wallet balance may be refunded upon account closure at ExclusiveGrade\'s discretion.' },
  { title: '5. Acceptable Use', body: 'You agree not to use ExclusiveGrade to upload false or misleading student data, attempt to access other schools\' data, reverse-engineer or scrape the platform, or use the platform for any unlawful purpose. Violation of these terms may result in immediate account suspension.' },
  { title: '6. Data Ownership', body: 'You retain ownership of all student data you upload to ExclusiveGrade. By uploading data, you grant ExclusiveGrade a limited license to store and process that data solely to provide the platform services. ExclusiveGrade does not claim ownership of your school\'s data.' },
  { title: '7. Service Availability', body: 'ExclusiveGrade targets 99% uptime but does not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance. ExclusiveGrade is not liable for losses resulting from service downtime.' },
  { title: '8. Termination', body: 'ExclusiveGrade may suspend or terminate accounts that violate these terms, fail to pay subscription fees, or engage in fraudulent activity. You may close your account at any time from your dashboard. Upon termination, your data is archived for 30 days before permanent deletion.' },
  { title: '9. Limitation of Liability', body: 'ExclusiveGrade\'s liability is limited to the amount you paid in the 3 months preceding the claim. ExclusiveGrade is not liable for indirect, incidental, or consequential damages arising from use of the platform.' },
  { title: '10. Governing Law', body: 'These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.' },
]

export default function Terms() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Legal</span>
          <h1>Terms of Service</h1>
          <p>Last updated: January 2025. Please read these terms carefully before using ExclusiveGrade.</p>
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
