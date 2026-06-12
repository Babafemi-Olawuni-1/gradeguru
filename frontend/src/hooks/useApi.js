import { useCallback, useRef } from 'react'
import { API_BASE_URL } from '../config'

export function useApi() {
  // Keep a stable ref to the token so request() never changes identity
  const tokenRef = useRef(localStorage.getItem('gg_token'))

  // Sync token ref on every render so it's always current
  tokenRef.current = localStorage.getItem('gg_token')

  const request = useCallback(async (method, path, body = null) => {
    const token = tokenRef.current

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
      res = await fetch(`${API_BASE_URL}${path}`, opts)
    } catch (networkErr) {
      throw new Error('Network error — check your connection')
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
  }, []) // stable — never recreated

  // These are also stable because request is stable
  const get  = useCallback((path)        => request('GET',    path),        [request])
  const post = useCallback((path, body)  => request('POST',   path, body),  [request])
  const put  = useCallback((path, body)  => request('PUT',    path, body),  [request])
  const del  = useCallback((path)        => request('DELETE', path),        [request])

  return { get, post, put, del, request }
}
