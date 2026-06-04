import { Download, FileText, Users, BarChart2 } from 'lucide-react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import styles from './Resources.module.css'

const templates = [
  {
    icon: Users,
    title: 'Student Import Template',
    desc: 'Required columns match exactly what the Add Student form expects: first_name, last_name, admission_number, class_name, date_of_birth.',
    filename: 'students_template.csv',
    content: 'first_name,last_name,admission_number,class_name,date_of_birth\nJohn,Doe,GF/2024/001,JSS1,2012-03-15\nJane,Smith,GF/2024/002,JSS1,2012-07-22\nEmeka,Obi,GF/2024/003,JSS2,2011-11-05',
  },
  {
    icon: BarChart2,
    title: 'Result Upload Template',
    desc: 'Required columns match the result entry form: admission_number, subject, ca1 (max 20), ca2 (max 20), exam (max 60).',
    filename: 'results_template.csv',
    content: 'admission_number,subject,ca1,ca2,exam\nGF/2024/001,Mathematics,18,17,55\nGF/2024/001,English Language,16,15,52\nGF/2024/002,Mathematics,15,14,48',
  },
  {
    icon: FileText,
    title: 'Teacher Import Template',
    desc: 'Required columns: first_name, last_name, email. A temporary password will be auto-generated and emailed.',
    filename: 'teachers_template.csv',
    content: 'first_name,last_name,email\nAmaka,Obi,amaka.obi@school.com\nChidi,Nwosu,chidi.nwosu@school.com',
  },
]

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function CsvTemplates() {
  return (
    <div>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.hero}>
          <span className={styles.label}>Resources</span>
          <h1>CSV Templates</h1>
          <p>Download ready-to-use CSV templates for importing students, results, and teachers into GradeGuru.</p>
        </div>

        <div className={styles.section}>
          <div className={styles.templatesGrid}>
            {templates.map(t => (
              <div key={t.title} className={styles.templateCard}>
                <div className={styles.templateIcon}><t.icon size={24} strokeWidth={1.8} /></div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
                <div className={styles.templatePreview}>
                  <code>{t.content.split('\n')[0]}</code>
                </div>
                <button className={styles.downloadBtn} onClick={() => downloadCsv(t.filename, t.content)}>
                  <Download size={16} /> Download Template
                </button>
              </div>
            ))}
          </div>

          <div className={styles.infoBox}>
            <h3>Tips for CSV Import</h3>
            <ul>
              <li>Keep the header row exactly as shown — column names are case-sensitive.</li>
              <li>Date format must be YYYY-MM-DD (e.g. 2012-03-15).</li>
              <li>Admission numbers must be unique within your school.</li>
              <li>Save your file as UTF-8 encoded CSV before uploading.</li>
              <li>Maximum 1,000 rows per import. Split larger files into batches.</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
