import { useState } from 'react'
import { BookOpen, ChevronRight, Search } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Resources.module.css'

const docs = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Registering Your School', desc: 'How to sign up, choose a slug, and get your school page live in minutes.' },
      { title: 'Setting Up Your Dashboard', desc: 'A walkthrough of the school admin dashboard and key settings.' },
      { title: 'Inviting Teachers', desc: 'How to create teacher accounts and assign them to classes and subjects.' },
    ]
  },
  {
    category: 'Students & Classes',
    items: [
      { title: 'Adding Students Manually', desc: 'Step-by-step guide to adding individual student records.' },
      { title: 'Bulk Import via CSV', desc: 'How to prepare and upload a CSV file to import students in bulk.' },
      { title: 'Managing Classes & Subjects', desc: 'Creating classes, adding subjects, and assigning teachers.' },
    ]
  },
  {
    category: 'Results & PINs',
    items: [
      { title: 'Uploading Results', desc: 'How teachers upload scores manually or via CSV, and publish results.' },
      { title: 'Generating PINs', desc: 'How to fund your wallet and generate single or bulk PINs.' },
      { title: 'Result Templates', desc: 'Customizing your grading scale and result sheet layout.' },
      { title: 'Checking Results (Parent Guide)', desc: 'How parents use a PIN and admission number to view results.' },
    ]
  },
  {
    category: 'Premium Features',
    items: [
      { title: 'AI Lesson Notes', desc: 'How to generate WASSCE-aligned lesson notes using the AI tool.' },
      { title: 'ID Card Generator', desc: 'Creating and downloading student ID cards in bulk.' },
      { title: 'Custom Domain Setup', desc: 'Connecting your own domain to your GradeGuru school page.' },
    ]
  },
]

export default function Documentation() {
  const [search, setSearch] = useState('')
  const filtered = docs.map(cat => ({
    ...cat,
    items: cat.items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.desc.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Resources</span>
          <h1>Documentation</h1>
          <p>Everything you need to get the most out of GradeGuru.</p>
          <div className={styles.searchWrap}>
            <Search size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documentation..." />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.docsGrid}>
            {filtered.map(cat => (
              <div key={cat.category} className={styles.docCategory}>
                <h3><BookOpen size={16} /> {cat.category}</h3>
                <ul>
                  {cat.items.map(item => (
                    <li key={item.title}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.desc}</p>
                      </div>
                      <ChevronRight size={16} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
