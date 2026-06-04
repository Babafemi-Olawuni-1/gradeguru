import { useState, useEffect, useCallback } from 'react'
import { Key, Plus, Copy, Check, Filter } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminPage.module.css'
import pStyles from './Pins.module.css'

export default function Pins() {
  const { school } = useAuth()
  const { get, post } = useApi()
  const [pins,    setPins]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [status,  setStatus]  = useState('')
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [terms,   setTerms]   = useState([])
  const [classes, setClasses] = useState([])
  const [form,    setForm]    = useState({ quantity: 10, term_id: '', class_id: '' })
  const [saving,  setSaving]  = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const [copied,  setCopied]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get(`/pins?page=${page}${status ? '&status=' + status : ''}`)
      setPins(res.data.items); setTotal(res.data.total)
    } catch(e) {} finally { setLoading(false) }
  }, [page, status])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    get('/classes').then(r => setClasses(r.data || [])).catch(() => {})
    // TODO: get terms from API
    setTerms([{ id: 1, name: 'First Term 2024/2025' }, { id: 2, name: 'Second Term 2024/2025' }])
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setResult(null)
    try {
      const res = await post('/pins', form)
      setResult(res.data); load()
    } catch(e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const copyPin = (pin) => {
    navigator.clipboard.writeText(pin)
    setCopied(pin); setTimeout(() => setCopied(null), 1500)
  }

  const pinPrice = { starter: 100, pro: 80, enterprise: 50 }[school?.plan || 'starter']
  const qty = parseInt(form.quantity) || 0
  const discount = qty >= 1000 ? 0.15 : qty >= 500 ? 0.10 : qty >= 100 ? 0.05 : 0
  const unitCost = pinPrice * (1 - discount)
  const totalCost = unitCost * qty

  const statusColor = { unused: styles.badgeBlue, used: styles.badgeGreen, expired: styles.badgeRed }

  return (
    <AdminLayout title="PIN Management">
      <div className={styles.pageHead}>
        <div className={pStyles.filterWrap}>
          <Filter size={15} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All PINs</option>
            <option value="unused">Unused</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button className={styles.btnPrimary} onClick={() => { setModal(true); setResult(null) }}>
          <Plus size={16} /> Generate PINs
        </button>
      </div>

      {/* Wallet reminder */}
      <div className={pStyles.walletBar}>
        <Key size={16} color="var(--purple-light)" />
        <span>Wallet Balance: <strong>₦{Number(school?.wallet || 0).toLocaleString()}</strong></span>
        <span className={pStyles.sep}>·</span>
        <span>PIN price: <strong>₦{pinPrice}/PIN</strong> ({school?.plan} plan)</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>PIN Code</th><th>Status</th><th>Student</th><th>Class</th><th>Cost</th><th>Expires</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><span className={styles.skeleton} /></td>)}</tr>)
            ) : pins.length === 0 ? (
              <tr><td colSpan={7} className={styles.empty}>No PINs yet. <button onClick={() => setModal(true)}>Generate some</button></td></tr>
            ) : pins.map(p => (
              <tr key={p.id}>
                <td><code>{p.pin_code}</code></td>
                <td><span className={statusColor[p.status] || styles.badgeBlue}>{p.status}</span></td>
                <td>{p.first_name ? `${p.first_name} ${p.last_name}` : <span className={styles.dim}>—</span>}</td>
                <td>{p.class_name || <span className={styles.dim}>—</span>}</td>
                <td>₦{Number(p.cost).toLocaleString()}</td>
                <td>{new Date(p.expires_at).toLocaleDateString()}</td>
                <td>
                  <button className={styles.rowActions.toString()} onClick={() => copyPin(p.pin_code)} title="Copy PIN"
                    style={{background:'none',border:'none',color:'var(--text-dim)',cursor:'pointer',padding:'4px'}}>
                    {copied === p.pin_code ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>{total} PIN{total !== 1 ? 's' : ''}</span>
        <div className={styles.pages}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page}</span>
          <button disabled={pins.length < 50} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>Generate PINs</h3>
              <button onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerate} className={styles.form}>
              {error && <div className={styles.formError}>{error}</div>}

              {result ? (
                <div className={pStyles.resultBox}>
                  <div className={pStyles.resultStat}><span>{result.quantity}</span><p>PINs Generated</p></div>
                  <div className={pStyles.resultStat}><span>₦{Number(result.total_cost).toLocaleString()}</span><p>Total Cost</p></div>
                  <div className={pStyles.resultStat}><span>₦{Number(result.new_balance).toLocaleString()}</span><p>New Balance</p></div>
                  {result.discount !== '0%' && <div className={pStyles.discountNote}>Bulk discount applied: {result.discount}</div>}
                  <button type="button" className={styles.btnPrimary} style={{width:'100%'}} onClick={() => setModal(false)}>Done</button>
                </div>
              ) : (
                <>
                  <div className={styles.field}>
                    <label>Term</label>
                    <select required value={form.term_id} onChange={e => setForm({...form, term_id: e.target.value})}>
                      <option value="">— Select term —</option>
                      {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Class (optional — leave blank for all classes)</label>
                    <select value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})}>
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label>Quantity</label>
                    <input type="number" min={1} max={5000} required value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                  </div>

                  <div className={pStyles.costPreview}>
                    <div><span>Unit price</span><strong>₦{unitCost.toLocaleString()}</strong></div>
                    {discount > 0 && <div><span>Bulk discount</span><strong className={pStyles.green}>{discount * 100}% off</strong></div>}
                    <div className={pStyles.totalRow}><span>Total cost</span><strong>₦{totalCost.toLocaleString()}</strong></div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnOutline} onClick={() => setModal(false)}>Cancel</button>
                    <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Generating...' : `Generate ${qty} PINs`}</button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
