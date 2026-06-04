import { Users, Target, Globe, Zap } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Page.module.css'

export default function About() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>About Us</span>
          <h1>Built for African Schools</h1>
          <p>GradeGuru was founded with one mission — make school result management simple, secure, and accessible for every school across Africa.</p>
        </div>

        <div className={styles.section}>
          <div className={styles.grid2}>
            <div className={styles.textBlock}>
              <h2>Our Story</h2>
              <p>We saw how schools struggled with paper-based result systems, long queues of parents, and lost result sheets. GradeGuru was built to solve that — giving every school a digital home, a secure PIN system, and tools that actually work on shared hosting and slow internet.</p>
              <p>Today, over 100 schools across Nigeria use GradeGuru to manage results, generate PINs, and communicate with parents — all from one dashboard.</p>
            </div>
            <div className={styles.statsBox}>
              <div className={styles.statItem}><span>100+</span><p>Schools Registered</p></div>
              <div className={styles.statItem}><span>50,000+</span><p>Results Checked</p></div>
              <div className={styles.statItem}><span>99%</span><p>Platform Uptime</p></div>
              <div className={styles.statItem}><span>3</span><p>Subscription Plans</p></div>
            </div>
          </div>
        </div>

        <div className={styles.section} style={{background:'var(--blue-mid)'}}>
          <div className={styles.sectionHead}>
            <h2>Our Values</h2>
            <p>What drives every decision we make at GradeGuru.</p>
          </div>
          <div className={styles.grid4}>
            {[
              { icon: Target,  title: 'Simplicity',    desc: 'Every feature is designed to be usable by a school admin with no technical background.' },
              { icon: Globe,   title: 'Accessibility',  desc: 'Works on shared hosting, slow connections, and any device — desktop or mobile.' },
              { icon: Users,   title: 'Community',      desc: 'We build with schools, not just for them. Feedback shapes every release.' },
              { icon: Zap,     title: 'Reliability',    desc: '99% uptime guarantee. Your results are always available when parents need them.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.valueCard}>
                <div className={styles.valueIcon}><Icon size={22} strokeWidth={1.8} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
