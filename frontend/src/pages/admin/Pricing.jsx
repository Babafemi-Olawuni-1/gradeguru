import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AdminLayout from '../../components/admin/AdminLayout'
import { CheckCircle, XCircle, Zap, ArrowRight, ChevronRight } from 'lucide-react'
import styles from './Pricing.module.css'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: { term: 'Free', year: 'Free' },
    desc: 'Perfect for small schools testing the platform.',
    color: '#64748b',
    features: [
      { text: 'Up to 5 students',            yes: true },
      { text: 'Up to 2 teachers',            yes: true },
      { text: 'School landing page',         yes: true },
      { text: 'Result upload & management',  yes: true },
      { text: 'PIN generation (₦100/PIN)',   yes: true },
      { text: 'Wallet system',               yes: true },
      { text: 'Bulk email to parents',       yes: false },
      { text: 'ID card generation',          yes: false },
      { text: 'AI lesson notes',             yes: false },
      { text: 'Remove GradeGuru branding',   yes: false },
      { text: 'Custom domain',               yes: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { term: '₦10,000', year: '₦8,000' },
    desc: 'For growing schools that need more power.',
    popular: true,
    color: '#7c3aed',
    features: [
      { text: 'Up to 200 students',          yes: true },
      { text: 'Up to 10 teachers',           yes: true },
      { text: 'Everything in Starter',       yes: true },
      { text: 'Bulk email (500/term)',        yes: true },
      { text: '50 ID cards/term',            yes: true },
      { text: '20 AI lesson notes/term',     yes: true },
      { text: 'PIN at ₦80 (save 20%)',       yes: true },
      { text: 'Remove GradeGuru branding',   yes: true },
      { text: 'Custom CSS',                  yes: true },
      { text: 'Custom domain',               yes: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { term: '₦30,000', year: '₦24,000' },
    desc: 'For large schools and multiple campuses.',
    color: '#d97706',
    features: [
      { text: 'Unlimited students',          yes: true },
      { text: 'Unlimited teachers',          yes: true },
      { text: 'Everything in Pro',           yes: true },
      { text: 'Unlimited bulk emails',       yes: true },
      { text: 'Unlimited ID cards',          yes: true },
      { text: 'Unlimited AI lesson notes',   yes: true },
      { text: 'PIN at ₦50 (save 50%)',       yes: true },
      { text: 'Custom domain included',      yes: true },
      { text: 'Full site builder',           yes: true },
      { text: 'Priority support',            yes: true },
    ],
  },
]

const ADDONS = [
  { name: 'Extra Student',    price: '₦250/student/term',  desc: 'Beyond your plan limit' },
  { name: 'Extra Teacher',    price: '₦1,000/teacher/term',desc: 'Beyond your plan limit' },
  { name: 'Extra ID Cards',   price: '₦50/card',           desc: 'Beyond monthly limit' },
  { name: 'Extra AI Notes',   price: '₦100/note',          desc: 'Beyond monthly limit' },
  { name: 'Bulk SMS (100)',   price: '₦1,000',             desc: '100 SMS credits' },
  { name: 'Custom Domain',    price: '₦7,500/term',        desc: 'Connect your own domain' },
]

export default function Pricing() {
  const { school } = useAuth()
  const [period, setPeriod] = useState('term')
  const currentPlan = school?.plan || 'starter'

  return (
    <AdminLayout title="Plans & Pricing">
      <div className={styles.page}>

        {/* Current plan banner */}
        <div className={styles.currentBanner}>
          <div className={styles.bannerLeft}>
            <Zap size={18} color="var(--purple)" />
            <div>
              <p className={styles.bannerLabel}>Your current plan</p>
              <p className={styles.bannerPlan}>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</p>
            </div>
          </div>
          {currentPlan !== 'enterprise' && (
            <p className={styles.bannerHint}>Upgrade below to unlock more features</p>
          )}
        </div>

        {/* Toggle */}
        <div className={styles.toggleWrap}>
          <div className={styles.toggle}>
            <button className={period === 'term' ? styles.toggleActive : ''} onClick={() => setPeriod('term')}>Per Term</button>
            <button className={period === 'year' ? styles.toggleActive : ''} onClick={() => setPeriod('year')}>
              Per Year <span className={styles.saveBadge}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className={styles.plansGrid}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id
            const isUpgrade = (currentPlan === 'starter' && (plan.id === 'pro' || plan.id === 'enterprise'))
                           || (currentPlan === 'pro'     && plan.id === 'enterprise')
            return (
              <div key={plan.id} className={`${styles.planCard} ${plan.popular ? styles.popular : ''} ${isCurrent ? styles.current : ''}`}>
                {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                {isCurrent   && <div className={styles.currentBadge}>Current Plan</div>}

                <div className={styles.planTop}>
                  <span className={styles.planName} style={{ color: plan.color }}>{plan.name}</span>
                  <div className={styles.planPrice}>
                    {plan.price[period]}
                    {plan.price[period] !== 'Free' && (
                      <span>/{period === 'year' ? 'yr' : 'term'}</span>
                    )}
                  </div>
                  <p className={styles.planDesc}>{plan.desc}</p>
                </div>

                <ul className={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <li key={i} className={!f.yes ? styles.featureNo : ''}>
                      {f.yes
                        ? <CheckCircle size={15} className={styles.checkIcon} />
                        : <XCircle    size={15} className={styles.crossIcon} />
                      }
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.planAction}>
                  {isCurrent ? (
                    <div className={styles.currentTag}>Active Plan</div>
                  ) : isUpgrade ? (
                    <button className={styles.upgradeBtn} style={{ background: plan.color }}>
                      Upgrade to {plan.name} <ArrowRight size={15} />
                    </button>
                  ) : (
                    <div className={styles.downgradTag}>Lower plan</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* PIN pricing */}
        <div className={styles.pinSection}>
          <h3>PIN Pricing by Plan</h3>
          <div className={styles.pinGrid}>
            {[
              { plan: 'Starter', price: '₦100', saving: '' },
              { plan: 'Pro',     price: '₦80',  saving: 'Save 20%' },
              { plan: 'Enterprise', price: '₦50', saving: 'Save 50%' },
            ].map(p => (
              <div key={p.plan} className={styles.pinCard}>
                <span className={styles.pinPlan}>{p.plan}</span>
                <span className={styles.pinPrice}>{p.price}<small>/PIN</small></span>
                {p.saving && <span className={styles.pinSaving}>{p.saving}</span>}
              </div>
            ))}
          </div>
          <div className={styles.bulkNote}>
            <strong>Bulk discounts:</strong>
            <span>100+ PINs → <b>5% off</b></span>
            <span>500+ PINs → <b>10% off</b></span>
            <span>1,000+ PINs → <b>15% off</b></span>
          </div>
        </div>

        {/* Add-ons */}
        <div className={styles.addonsSection}>
          <h3>Add-Ons</h3>
          <p>Available on any plan. Charged from your wallet.</p>
          <div className={styles.addonsGrid}>
            {ADDONS.map(a => (
              <div key={a.name} className={styles.addonCard}>
                <div>
                  <strong>{a.name}</strong>
                  <span>{a.desc}</span>
                </div>
                <div className={styles.addonPrice}>{a.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <h3>Common Questions</h3>
          <div className={styles.faqGrid}>
            {[
              { q: 'When does billing happen?', a: 'Subscriptions are billed per term. You pay at the start of each term to activate your plan.' },
              { q: 'Can I downgrade?', a: 'Yes. Downgrading takes effect at the end of your current term. Your data is never deleted.' },
              { q: 'What happens if I exceed my student limit?', a: 'You can purchase Extra Student add-ons at ₦250/student/term, or upgrade your plan.' },
              { q: 'Is there a free trial?', a: 'The Starter plan is permanently free with up to 5 students. No credit card required.' },
            ].map(f => (
              <div key={f.q} className={styles.faqCard}>
                <strong>{f.q}</strong>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
