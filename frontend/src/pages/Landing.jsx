import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, School, FileText, Lock, Wallet, Bot, CreditCard,
  BarChart3, Megaphone, Globe, CheckCircle, XCircle, Star,
  ChevronRight, Users, BookOpen, ShieldCheck, Zap
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './Landing.module.css'

/* ── animated counter hook ── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = Math.ceil(target / (duration / 16))
      const timer = setInterval(() => {
        start = Math.min(start + step, target)
        setCount(start)
        if (start >= target) clearInterval(timer)
      }, 16)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return [count, ref]
}

/* ── fade-in hook ── */
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add(styles.visible)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ── stat item ── */
function Stat({ target, suffix, label }) {
  const [count, ref] = useCounter(target)
  return (
    <div className={styles.stat} ref={ref}>
      <span className={styles.statNum}>{count.toLocaleString()}{suffix}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

/* ── feature card ── */
function FeatureCard({ icon: Icon, title, desc }) {
  const ref = useFadeIn()
  return (
    <div className={`${styles.featureCard} ${styles.fadeUp}`} ref={ref}>
      <div className={styles.featureIcon}><Icon size={24} strokeWidth={1.8} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

/* ── step card ── */
function StepCard({ icon: Icon, num, title, desc }) {
  const ref = useFadeIn()
  return (
    <div className={`${styles.stepCard} ${styles.fadeUp}`} ref={ref}>
      <div className={styles.stepNum}><Icon size={20} strokeWidth={2} /></div>
      <span className={styles.stepIndex}>{String(num).padStart(2, '0')}</span>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

/* ── pricing card ── */
function PricingCard({ plan, price, annualPrice, desc, features, popular, period }) {
  const ref = useFadeIn()
  const displayPrice = period === 'annual' && price !== 'Free' ? annualPrice : price
  return (
    <div className={`${styles.pricingCard} ${popular ? styles.popular : ''} ${styles.fadeUp}`} ref={ref}>
      {popular && <div className={styles.popularBadge}>Most Popular</div>}
      <div className={styles.planName}>{plan}</div>
      <div className={styles.planPrice}>
        {displayPrice}
        {price !== 'Free' && <span>/{period === 'annual' ? 'yr, billed annually' : 'term'}</span>}
      </div>
      <p className={styles.planDesc}>{desc}</p>
      <ul className={styles.planFeatures}>
        {features.map((f, i) => (
          <li key={i} className={f.included ? '' : styles.disabled}>
            {f.included
              ? <CheckCircle size={16} strokeWidth={2} className={styles.check} />
              : <XCircle size={16} strokeWidth={2} className={styles.cross} />}
            {f.text}
          </li>
        ))}
      </ul>
      <Link to="/register" className={`${styles.planBtn} ${popular ? styles.planBtnPrimary : styles.planBtnOutline}`}>
        {plan === 'Enterprise' ? 'Contact Sales' : plan === 'Starter' ? 'Start for Free' : 'Start Pro Plan'}
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

/* ── testimonial card ── */
function TestimonialCard({ quote, name, role, initials }) {
  const ref = useFadeIn()
  return (
    <div className={`${styles.testimonialCard} ${styles.fadeUp}`} ref={ref}>
      <div className={styles.stars}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />)}</div>
      <p>"{quote}"</p>
      <div className={styles.reviewer}>
        <div className={styles.reviewerAvatar}>{initials}</div>
        <div>
          <h5>{name}</h5>
          <span>{role}</span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════ */
export default function Landing() {
  const [period, setPeriod] = useState('monthly')

  const features = [
    { icon: School,      title: 'Branded School Page',   desc: 'Every school gets a public page at gradeguru.com/schoolname with logo, colors, and contact info.' },
    { icon: FileText,    title: 'Result Management',     desc: 'Upload results via CSV or manually. Save drafts, publish by term, apply custom grading templates.' },
    { icon: Lock,        title: 'Secure PIN System',     desc: 'Generate single or bulk PINs. Each PIN is single-use with expiry dates and full audit trails.' },
    { icon: Wallet,      title: 'Wallet & Payments',     desc: 'Fund your school wallet via Paystack or Flutterwave. Track every transaction with full history.' },
    { icon: Bot,         title: 'AI Lesson Notes',       desc: 'Teachers enter a topic and class level — AI generates complete, WASSCE-aligned lesson notes instantly.' },
    { icon: CreditCard,  title: 'ID Card Generator',     desc: 'Generate print-ready student ID cards with photos, QR codes, and school branding in bulk.' },
    { icon: BarChart3,   title: 'Analytics Dashboard',   desc: 'Track PIN usage, result access logs, wallet transactions, and student performance at a glance.' },
    { icon: Megaphone,   title: 'Announcements',         desc: 'Post school-wide announcements directly to your landing page. Schedule by publish date.' },
    { icon: Globe,       title: 'Custom Domain',         desc: 'Enterprise schools can connect their own domain. Full site builder with custom CSS and SEO control.' },
  ]

  const steps = [
    { icon: School,     title: 'Register Your School',    desc: 'Sign up and instantly get your branded URL at gradeguru.com/yourschool. No technical setup needed.' },
    { icon: Users,      title: 'Add Students & Teachers', desc: 'Import students via CSV or add manually. Assign teachers to classes and subjects in seconds.' },
    { icon: FileText,   title: 'Upload Results',          desc: 'Teachers upload scores via CSV or enter manually. Save drafts, then publish when ready.' },
    { icon: Lock,       title: 'Generate PINs',           desc: 'Fund your wallet and generate secure PINs. Bulk discounts available for large batches.' },
    { icon: ShieldCheck,title: 'Parents Check Results',   desc: 'Parents visit your school page, enter the PIN and admission number — results appear instantly.' },
  ]

  const plans = [
    {
      plan: 'Starter', price: 'Free', annualPrice: 'Free',
      desc: 'Perfect for small schools testing the platform.',
      features: [
        { text: 'Up to 5 students', included: true },
        { text: 'Up to 2 teachers', included: true },
        { text: 'School landing page', included: true },
        { text: 'Result upload & management', included: true },
        { text: 'PIN generation (₦100/PIN)', included: true },
        { text: 'Wallet system', included: true },
        { text: 'Bulk email to parents', included: false },
        { text: 'ID card generation', included: false },
        { text: 'AI lesson notes', included: false },
        { text: 'Remove GradeGuru branding', included: false },
      ]
    },
    {
      plan: 'Pro', price: '₦10,000', annualPrice: '₦8,000', popular: true,
      desc: 'Per term. For growing schools that need more power.',
      features: [
        { text: 'Up to 200 students', included: true },
        { text: 'Up to 10 teachers', included: true },
        { text: 'Everything in Starter', included: true },
        { text: 'Bulk email to parents (500/term)', included: true },
        { text: '50 ID cards/term', included: true },
        { text: '20 AI lesson notes/term', included: true },
        { text: 'PIN at ₦80 (save 20%)', included: true },
        { text: 'Remove GradeGuru branding', included: true },
        { text: 'Custom domain', included: false },
      ]
    },
    {
      plan: 'Enterprise', price: '₦30,000', annualPrice: '₦24,000',
      desc: 'Per term. For large schools and multiple campuses.',
      features: [
        { text: 'Unlimited students', included: true },
        { text: 'Unlimited teachers', included: true },
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited bulk emails', included: true },
        { text: 'Unlimited ID cards', included: true },
        { text: 'Unlimited AI lesson notes', included: true },
        { text: 'PIN at ₦50 (save 50%)', included: true },
        { text: 'Custom domain included', included: true },
        { text: 'Priority support', included: true },
      ]
    },
  ]

  const testimonials = [
    { quote: 'GradeGuru transformed how we handle results. Parents no longer queue at the school gate — they check results from their phones.', name: 'Adaeze Okonkwo', role: 'Principal, Sunrise Academy, Lagos', initials: 'AO' },
    { quote: 'The AI lesson notes feature alone is worth the Pro plan. My teachers save hours every week preparing for class.', name: 'Babatunde Musa', role: 'Head Teacher, Excel College, Abuja', initials: 'BM' },
    { quote: 'Setting up took less than 10 minutes. We had our school page live and PINs generated before the end of the day.', name: 'Fatima Eze', role: 'Admin, Greenfield Schools, Port Harcourt', initials: 'FE' },
  ]

  return (
    <div className={`${styles.page} landing-page`}>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Zap size={14} fill="currentColor" />
            Trusted by 100+ Schools Across Nigeria
          </div>
          <h1>
            The Smarter Way to<br />
            <span className={styles.highlight}>Manage School Results</span>
          </h1>
          <p>GradeGuru gives every school a branded page, secure PIN-based result access, AI lesson notes, and ID card generation — all in one platform.</p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.btnPrimary}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className={styles.btnOutline}>
              See How It Works
            </a>
          </div>
          <div className={styles.heroStats}>
            <Stat target={500}   suffix="+" label="Schools Registered" />
            <Stat target={50000} suffix="+" label="Results Checked" />
            <Stat target={99}    suffix="%" label="Uptime" />
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroImageCard}>
            <img
              src="/report.jfif"
              alt="Sample student result sheet"
              className={styles.reportImg}
            />
            <div className={styles.reportOverlay}>
              <CheckCircle size={14} strokeWidth={2.5} color="#4ade80" />
              Live Result Preview
            </div>
          </div>
          {/* floating badges */}
          <div className={`${styles.floatBadge} ${styles.floatBadge1}`}>
            <ShieldCheck size={16} color="#4ade80" />
            <span>PIN Verified</span>
          </div>
          <div className={`${styles.floatBadge} ${styles.floatBadge2}`}>
            <BarChart3 size={16} color="#a78bfa" />
            <span>Avg: 85.2%</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Simple Process</span>
          <h2 className={styles.sectionTitle}>Up and running in minutes</h2>
          <p className={styles.sectionSub}>From registration to your first result check — GradeGuru makes it effortless for any school.</p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((s, i) => <StepCard key={i} num={i + 1} {...s} />)}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Everything You Need</span>
          <h2 className={styles.sectionTitle}>Built for every role in your school</h2>
          <p className={styles.sectionSub}>From the school admin to the parent checking results on a phone — GradeGuru covers every touchpoint.</p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => <FeatureCard key={i} {...f} />)}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className={styles.pricing} id="pricing">
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Transparent Pricing</span>
          <h2 className={styles.sectionTitle}>Plans for every school size</h2>
          <p className={styles.sectionSub}>Start free, scale as you grow. No hidden fees — just pay per PIN when you need them.</p>
          <div className={styles.toggle}>
            <button className={period === 'monthly' ? styles.toggleActive : ''} onClick={() => setPeriod('monthly')}>Per Term</button>
            <button className={period === 'annual' ? styles.toggleActive : ''} onClick={() => setPeriod('annual')}>
              Per Year <span className={styles.saveBadge}>Save 20%</span>
            </button>
          </div>
        </div>
        <div className={styles.pricingGrid}>
          {plans.map((p, i) => <PricingCard key={i} {...p} period={period} />)}
        </div>
        <div className={styles.bulkNote}>
          <BookOpen size={18} color="var(--purple-light)" />
          <strong>Bulk PIN Discounts:</strong>
          <span>100+ PINs → <b>5% off</b></span>
          <span>500+ PINs → <b>10% off</b></span>
          <span>1,000+ PINs → <b>15% off</b></span>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={styles.testimonials} id="testimonials">
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>What Schools Say</span>
          <h2 className={styles.sectionTitle}>Loved by school administrators</h2>
          <p className={styles.sectionSub}>Real feedback from schools already using GradeGuru across Nigeria.</p>
        </div>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((t, i) => <TestimonialCard key={i} {...t} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <h2>Ready to modernize your school?</h2>
        <p>Join hundreds of schools already using GradeGuru. Start free — no credit card required.</p>
        <div className={styles.ctaActions}>
          <Link to="/register" className={styles.btnPrimary}>
            Register Your School Free <ArrowRight size={18} />
          </Link>
          <a href="#features" className={styles.btnOutline}>Explore Features</a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
