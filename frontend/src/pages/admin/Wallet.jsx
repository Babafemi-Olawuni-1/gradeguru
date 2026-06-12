import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Check } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import styles from './AdminPage.module.css'
import wStyles from './Wallet.module.css'

export default function Wallet() {
  const { get, post } = useApi()
  const { updateSchool, school } = useAuth()
  const location = useLocation()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [amount,  setAmount]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [payUrl,  setPayUrl]  = useState(null)
  const [error,   setError]   = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified,  setVerified]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await get('/wallet')
      setData(res.data)
      updateSchool({ ...school, wallet: res.data.balance })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => { load() }, [load])

  // Auto-verify after returning from Paystack redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('verify') || params.get('reference') || params.get('trxref')
    if (!ref) return

    setVerifying(true)
    get(`/wallet/verify?reference=${encodeURIComponent(ref)}`)
      .then(res => {
        setVerified(true)
        load()
        // Clean URL
        window.history.replaceState({}, '', '/admin/wallet')
      })
      .catch(e => setError('Payment verification failed: ' + e.message))
      .finally(() => setVerifying(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTopup = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await post('/wallet', { amount: parseFloat(amount) })
      setPayUrl(res.data.payment_url)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const txIcon = (type) => type === 'topup'
    ? <ArrowUpRight size={16} color="#4ade80" />
    : <ArrowDownLeft size={16} color="#f87171" />

  const txColor = (type) => type === 'topup' ? wStyles.credit : wStyles.debit

  return (
    <AdminLayout title="Wallet">

      {verifying && (
        <div className={wStyles.verifyBanner}>
          <span className={wStyles.spinnerSm} />
          Verifying payment...
        </div>
      )}

      {verified && (
        <div className={wStyles.successBanner}>
          <Check size={16} /> Payment verified — wallet has been credited.
        </div>
      )}

      <div className={wStyles.balanceCard}>
        <div>
          <p className={wStyles.balanceLabel}>Available Balance</p>
          {loading
            ? <span className={styles.skeleton} style={{ width: 160, height: 40, display: 'block' }} />
            : <h2 className={wStyles.balanceAmount}>₦{Number(data?.balance || 0).toLocaleString()}</h2>
          }
        </div>
        <div className={wStyles.balanceActions}>
          <button className={styles.btnPrimary} onClick={() => { setModal(true); setPayUrl(null); setError('') }}>
            <Plus size={16} /> Fund Wallet
          </button>
          <button className={styles.btnOutline} onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? wStyles.spinning : ''} />
          </button>
        </div>
      </div>

      <h3 className={wStyles.txTitle}>Transaction History</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Description</th>
              <th>Amount</th><th>Balance After</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><span className={styles.skeleton} /></td>)}</tr>
              ))
            ) : !data?.transactions?.items?.length ? (
              <tr><td colSpan={6} className={styles.empty}>No transactions yet.</td></tr>
            ) : data.transactions.items.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {txIcon(t.type)}
                    <span style={{ textTransform: 'capitalize' }}>{t.type.replace('_', ' ')}</span>
                  </div>
                </td>
                <td>{t.description || '—'}</td>
                <td className={txColor(t.type)}>
                  {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                </td>
                <td>₦{Number(t.balance_after).toLocaleString()}</td>
                <td>
                  <span className={t.status === 'success' ? styles.badgeGreen : t.status === 'pending' ? styles.badgeBlue : styles.badgeRed}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fund Wallet Modal */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>Fund Wallet</h3>
              <button onClick={() => setModal(false)}>✕</button>
            </div>
            <div className={styles.form}>
              {payUrl ? (
                <div className={wStyles.payBox}>
                  <WalletIcon size={40} color="var(--purple-light)" />
                  <h4>Payment Ready</h4>
                  <p>Click below to complete your payment via Paystack. You'll be redirected back automatically.</p>
                  <a
                    href={payUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.btnPrimary}
                    style={{ justifyContent: 'center' }}
                    onClick={() => setModal(false)}
                  >
                    Proceed to Payment
                  </a>
                  <button className={styles.btnOutline} onClick={() => { setModal(false); load() }}>
                    I've paid — refresh balance
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTopup}>
                  {error && <div className={styles.formError}>{error}</div>}
                  <div className={styles.field}>
                    <label>Amount (₦)</label>
                    <input
                      type="number"
                      min={500}
                      step={100}
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="e.g. 5000"
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Minimum: ₦500</span>
                  </div>
                  <div className={wStyles.quickAmounts}>
                    {[1000, 5000, 10000, 20000, 50000].map(a => (
                      <button
                        key={a}
                        type="button"
                        className={amount == a ? wStyles.quickActive : wStyles.quickBtn}
                        onClick={() => setAmount(a)}
                      >
                        ₦{a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnOutline} onClick={() => setModal(false)}>Cancel</button>
                    <button type="submit" className={styles.btnPrimary} disabled={saving}>
                      {saving ? 'Processing...' : 'Continue to Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
