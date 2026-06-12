import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  Globe, Copy, Check, ExternalLink, Upload, Palette,
  Phone, Mail, MapPin, FileText, Save, Crown, Image,
  User, BookOpen, Plus, Trash2
} from 'lucide-react'
import styles from './Settings.module.css'
import { resolveUrl } from '../../utils/resolveUrl'
import { API_BASE_URL } from '../../config'

const REPORT_TEMPLATES = [
  {
    id: 'classic', name: 'Classic',
    desc: 'Traditional Nigerian report card with full subject table and grading remarks.',
    preview: (color) => (
      <div className={styles.templatePreview} style={{ borderTop: `4px solid ${color}` }}>
        <div className={styles.tpHeader}>
          <div className={styles.tpLogo} style={{ background: color }} />
          <div><div className={styles.tpLine} style={{ width: 120, background: color + '33' }} /><div className={styles.tpLine} style={{ width: 80 }} /></div>
        </div>
        <div className={styles.tpTable}>{[1,2,3,4].map(i => <div key={i} className={styles.tpRow}><div /><div /><div /><div /></div>)}</div>
        <div className={styles.tpFooter}><div className={styles.tpLine} style={{ width: 60 }} /></div>
      </div>
    )
  },
  {
    id: 'modern', name: 'Modern',
    desc: 'Clean card-based layout with color-coded grades and performance bar.',
    preview: (color) => (
      <div className={styles.templatePreview} style={{ background: color + '08', border: `1px solid ${color}33` }}>
        <div className={styles.tpHeader}>
          <div className={styles.tpLogo} style={{ background: color, borderRadius: '50%' }} />
          <div><div className={styles.tpLine} style={{ width: 100, background: color + '44' }} /><div className={styles.tpLine} style={{ width: 70 }} /></div>
        </div>
        <div className={styles.tpCards}>{[1,2,3].map(i => <div key={i} className={styles.tpCard} style={{ borderLeft: `3px solid ${color}` }}><div /><div /></div>)}</div>
        <div className={styles.tpBar} style={{ background: color + '22' }}><div style={{ width: '72%', background: color, height: '100%', borderRadius: 4 }} /></div>
      </div>
    )
  },
  {
    id: 'minimal', name: 'Minimal',
    desc: 'Simple, print-friendly layout. Great for schools with limited printing resources.',
    preview: (color) => (
      <div className={styles.templatePreview}>
        <div style={{ borderBottom: `2px solid ${color}`, paddingBottom: 8, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className={styles.tpLogo} style={{ background: color, width: 20, height: 20 }} />
          <div className={styles.tpLine} style={{ width: 90, background: color + '33' }} />
        </div>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <div className={styles.tpLine} style={{ flex: 2 }} /><div className={styles.tpLine} style={{ flex: 1 }} /><div className={styles.tpLine} style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    )
  },
]

const COLORS = ['#7c3aed','#2563eb','#059669','#dc2626','#d97706','#0891b2','#db2777','#0f172a']

export default function Settings() {
  const { school, updateSchool } = useAuth()
  const { get, put } = useApi()

  const [form, setForm] = useState({
    name: '', welcome_text: '', phone: '', address: '', email: '',
    primary_color: '#7c3aed', report_template: 'classic',
    about: '', founded_year: '', founder_name: '', motto: '', school_type: '',
  })
  const [logoPreview,    setLogoPreview]    = useState(null)
  const [logoFile,       setLogoFile]       = useState(null)
  // Each gallery entry: { preview: string (blob: or resolved URL), url: string|null (server path), file: File|null }
  const [gallery,        setGallery]        = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [copied,   setCopied]   = useState(false)
  const logoRef    = useRef()
  const galleryRef = useRef()

  const siteUrl = `${window.location.origin}/s/${school?.slug}`

  useEffect(() => {
    get('/school').then(res => {
      const s = res.data.school
      setForm({
        name:            s.name            || '',
        welcome_text:    s.welcome_text    || '',
        phone:           s.phone           || '',
        address:         s.address         || '',
        email:           s.email           || '',
        primary_color:   s.primary_color   || '#7c3aed',
        report_template: s.report_template || 'classic',
        about:           s.about           || '',
        founded_year:    s.founded_year    || '',
        founder_name:    s.founder_name    || '',
        motto:           s.motto           || '',
        school_type:     s.school_type     || '',
      })
      if (s.logo_url) setLogoPreview(resolveUrl(s.logo_url))
      if (s.gallery) {
        try {
          const arr = typeof s.gallery === 'string' ? JSON.parse(s.gallery) : s.gallery
          if (Array.isArray(arr)) {
            setGallery(arr.map(url => ({ preview: resolveUrl(url), url, file: null })))
          }
        } catch {}
      }
    }).catch(e => {
      setError('Could not load school settings: ' + e.message)
    }).finally(() => setLoading(false))
  }, [])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const newEntries = files.map(f => ({ preview: URL.createObjectURL(f), url: null, file: f }))
    setGallery(prev => [...prev, ...newEntries])
  }

  const removeGalleryImage = (i) => {
    setGallery(prev => prev.filter((_, idx) => idx !== i))
  }

  const uploadFile = async (file, type = 'logo') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch(`${API_BASE_URL}/school/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('gg_token')}` },
      body: fd,
    })
    const text = await res.text()
    if (!text || text.trim() === '') throw new Error('Upload returned empty response')
    let data
    try { data = JSON.parse(text) } catch { throw new Error(`Upload error: ${text.slice(0, 200)}`) }
    if (!data.success) throw new Error(data.message || 'Upload failed')
    return data.data.url  // root-relative path e.g. /grade_guru/.../file.jpg
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const payload = { ...form }

      // ── Logo ──────────────────────────────────────────────
      if (logoFile) {
        // Upload new logo — backend also saves it to DB immediately
        const uploadedPath = await uploadFile(logoFile, 'logo')
        payload.logo_url = uploadedPath
        setLogoFile(null)
        setLogoPreview(resolveUrl(uploadedPath))
      }

      // ── Gallery ───────────────────────────────────────────
      // Upload any new files, keep existing server paths as-is
      const resolvedGallery = await Promise.all(
        gallery.map(async (entry) => {
          if (entry.file) {
            // New file — upload it
            const uploadedPath = await uploadFile(entry.file, 'gallery')
            return uploadedPath
          }
          // Existing server URL — keep the stored path (strip host if absolute)
          const stored = entry.url || entry.preview
          if (!stored || stored.startsWith('blob:')) return null
          return stored.startsWith('http') ? new URL(stored).pathname : stored
        })
      )
      const galleryPaths = resolvedGallery.filter(Boolean)

      // Update gallery state so new entries now have their server URLs
      setGallery(prev => prev.map((entry, i) =>
        entry.file ? { ...entry, file: null, url: resolvedGallery[i], preview: resolveUrl(resolvedGallery[i]) } : entry
      ))

      payload.gallery = JSON.stringify(galleryPaths)

      // ── Save all fields to DB ─────────────────────────────
      const res = await put('/school', payload)

      // Use the fresh school object returned from DB as the source of truth
      const freshSchool = res.data  // this IS the school row from DB
      updateSchool({ ...school, ...freshSchool })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(siteUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AdminLayout title="Settings">
      <div className={styles.page}>

        {/* ── Site Link ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Globe size={18} color="var(--purple)" />
            <div><h3>Your School Page</h3><p>Share this link with parents so they can check results.</p></div>
          </div>
          <div className={styles.linkBox}>
            <div className={styles.linkUrl}><Globe size={14} /><span>{siteUrl}</span></div>
            <div className={styles.linkActions}>
              <button className={styles.iconBtn} onClick={copyLink} title="Copy">
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
              </button>
              <a href={`/s/${school?.slug}`} target="_blank" rel="noreferrer" className={styles.iconBtn} title="Open">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <p className={styles.linkNote}>Parents visit this page to check results using their PIN.</p>
        </div>

        {/* ── School Identity ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Upload size={18} color="var(--purple)" />
            <div><h3>School Identity</h3><p>Logo and name shown on your school page, report cards, and sidebar.</p></div>
          </div>
          <div className={styles.identityRow}>
            <div className={styles.logoWrap}>
              <div className={styles.logoUpload} onClick={() => logoRef.current.click()}>
                {logoPreview
                  ? <img src={logoPreview} alt="Logo" className={styles.logoImg} />
                  : <div className={styles.logoPlaceholder} style={{ background: form.primary_color }}>
                      {form.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                }
                <div className={styles.logoOverlay}><Upload size={16} /><span>Upload</span></div>
                <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
              </div>
              <p className={styles.logoHint}>PNG/JPG max 2MB</p>
            </div>
            <div className={styles.identityFields}>
              <div className={styles.field}>
                <label>School Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Greenfield Academy" />
              </div>
              <div className={styles.field}>
                <label>Welcome Message / Tagline</label>
                <textarea rows={2} value={form.welcome_text} onChange={e => setForm({ ...form, welcome_text: e.target.value })} placeholder="Excellence in education since..." />
              </div>
              <div className={styles.field}>
                <label>School Motto</label>
                <input value={form.motto} onChange={e => setForm({ ...form, motto: e.target.value })} placeholder="e.g. Knowledge is Power" />
              </div>
            </div>
          </div>
        </div>

        {/* ── About the School ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <BookOpen size={18} color="var(--purple)" />
            <div><h3>About the School</h3><p>This appears in the About section of your school page.</p></div>
          </div>
          <div className={styles.aboutGrid}>
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label>About / School Description</label>
              <textarea rows={4} value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} placeholder="Tell parents and students about your school — history, values, achievements..." />
            </div>
            <div className={styles.field}>
              <label><User size={13} /> Founder's Name</label>
              <input value={form.founder_name} onChange={e => setForm({ ...form, founder_name: e.target.value })} placeholder="e.g. Dr. Adaeze Okonkwo" />
            </div>
            <div className={styles.field}>
              <label>Year Founded</label>
              <input type="number" min="1900" max="2099" value={form.founded_year} onChange={e => setForm({ ...form, founded_year: e.target.value })} placeholder="e.g. 2005" />
            </div>
            <div className={styles.field}>
              <label>School Type</label>
              <select value={form.school_type} onChange={e => setForm({ ...form, school_type: e.target.value })}>
                <option value="">— Select type —</option>
                <option value="Primary">Primary School</option>
                <option value="Secondary">Secondary School</option>
                <option value="Primary & Secondary">Primary & Secondary</option>
                <option value="Nursery & Primary">Nursery & Primary</option>
                <option value="Nursery, Primary & Secondary">Nursery, Primary & Secondary</option>
                <option value="University">University</option>
                <option value="Polytechnic">Polytechnic</option>
                <option value="College of Education">College of Education</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Brand Color ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Palette size={18} color="var(--purple)" />
            <div><h3>Brand Color</h3><p>Used on your school page header, buttons, and report card accents.</p></div>
          </div>
          <div className={styles.colorRow}>
            {COLORS.map(c => (
              <button key={c} className={`${styles.colorSwatch} ${form.primary_color === c ? styles.colorActive : ''}`}
                style={{ background: c }} onClick={() => setForm({ ...form, primary_color: c })}>
                {form.primary_color === c && <Check size={14} color="#fff" />}
              </button>
            ))}
            <div className={styles.colorCustom}>
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
              <span>Custom</span>
            </div>
          </div>
          <div className={styles.colorPreview} style={{ background: form.primary_color }}>
            <span>{form.name || 'Your School'}</span>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem' }}>
              Check Result
            </button>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Phone size={18} color="var(--purple)" />
            <div><h3>Contact Information</h3><p>Shown on your public school page.</p></div>
          </div>
          <div className={styles.contactGrid}>
            <div className={styles.field}>
              <label><Phone size={13} /> Phone Number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+234 800 000 0000" />
            </div>
            <div className={styles.field}>
              <label><Mail size={13} /> Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@yourschool.com" />
            </div>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label><MapPin size={13} /> School Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 School Road, Lagos, Nigeria" />
            </div>
          </div>
        </div>

        {/* ── Gallery ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Image size={18} color="var(--purple)" />
            <div><h3>Gallery / Carousel Images</h3><p>These images appear in the hero carousel on your school page. Upload up to 6 images.</p></div>
          </div>
          <div className={styles.galleryGrid}>
            {gallery.map((entry, i) => (
              <div key={i} className={styles.galleryItem}>
                <img src={entry.preview} alt={`Gallery ${i + 1}`} />
                <button className={styles.galleryRemove} onClick={() => removeGalleryImage(i)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {gallery.length < 6 && (
              <div className={styles.galleryAdd} onClick={() => galleryRef.current.click()}>
                <Plus size={24} />
                <span>Add Image</span>
                <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: 'none' }} />
              </div>
            )}
          </div>
          <p className={styles.logoHint}>JPG or PNG, max 5MB each. First image is the main hero background.</p>
        </div>

        {/* ── Report Card Template ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <FileText size={18} color="var(--purple)" />
            <div><h3>Report Card Template</h3><p>Choose the layout for student result sheets.</p></div>
          </div>
          <div className={styles.templatesGrid}>
            {REPORT_TEMPLATES.map(t => (
              <div key={t.id}
                className={`${styles.templateCard} ${form.report_template === t.id ? styles.templateActive : ''}`}
                onClick={() => setForm({ ...form, report_template: t.id })}>
                {t.preview(form.primary_color)}
                <div className={styles.templateInfo}>
                  <div className={styles.templateName}>
                    {t.name}
                    {form.report_template === t.id && <span className={styles.templateBadge}><Check size={11} /> Selected</span>}
                  </div>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan ── */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <Crown size={18} color="var(--purple)" />
            <div><h3>Current Plan</h3><p>Your subscription and feature access.</p></div>
          </div>
          <div className={styles.planCard}>
            <div className={styles.planLeft}>
              <span className={`${styles.planBadge} ${styles['plan_' + (school?.plan || 'starter')]}`}>
                {(school?.plan || 'starter').toUpperCase()}
              </span>
              <div>
                <p className={styles.planName}>{school?.plan === 'pro' ? 'Pro Plan — ₦10,000/term' : school?.plan === 'enterprise' ? 'Enterprise Plan — ₦30,000/term' : 'Starter Plan (Free)'}</p>
                <p className={styles.planDesc}>
                  {(!school?.plan || school?.plan === 'starter') && 'Up to 10 students, 2 teachers. Upgrade to unlock more.'}
                  {school?.plan === 'pro'        && 'Up to 200 students, 10 teachers, AI notes, ID cards, bulk email.'}
                  {school?.plan === 'enterprise' && 'Unlimited everything + custom domain + priority support.'}
                </p>
              </div>
            </div>
            {school?.plan !== 'enterprise' && (
              <a href="/admin/pricing" className={styles.upgradeBtn}>
                Upgrade Plan <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* ── Save ── */}
        {error && <div className={styles.errorMsg}>{error}</div>}
        <div className={styles.saveRow}>
          {saved && <div className={styles.savedMsg}><Check size={16} color="#16a34a" /> Settings saved successfully</div>}
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : <><Save size={16} /> Save All Settings</>}
          </button>
        </div>

      </div>
    </AdminLayout>
  )
}
