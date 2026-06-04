import { useCallback } from 'react'

const BASE = '/api'

export function useApi() {
  const request = useCallback(async (method, path, body = null) => {
    const token = localStorage.getItem('gg_token')

    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
    if (body) opts.body = JSON.stringify(body)

    let res
    try {
      res = await fetch(`${BASE}${path}`, opts)
    } catch (networkErr) {
      throw new Error(`Network error — check your connection`)
    }

    const text = await res.text()

    if (!text || text.trim() === '') {
      throw new Error(`Empty response from server (${method} ${path}) — HTTP ${res.status}`)
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Server error (${method} ${path}): ${text.slice(0, 200)}`)
    }

    // Token expired — redirect to login
    if (res.status === 401) {
      localStorage.removeItem('gg_token')
      localStorage.removeItem('gg_user')
      localStorage.removeItem('gg_school')
      window.location.href = '/login'
      throw new Error('Session expired. Please log in again.')
    }

    if (!data.success) throw new Error(data.message || 'Request failed')
    return data
  }, [])

  const get  = (path)       => request('GET',    path)
  const post = (path, body) => request('POST',   path, body)
  const put  = (path, body) => request('PUT',    path, body)
  const del  = (path)       => request('DELETE', path)

  return { get, post, put, del }
}
