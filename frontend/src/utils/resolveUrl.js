/**
 * Converts a stored image path to a full displayable URL.
 *
 * Uploaded files are stored as paths like:
 *   /backend/uploads/logos/school_abc.png
 *   /backend/uploads/gallery/school_xyz.jpg
 *
 * We prepend the production domain so images load everywhere.
 */

const SITE_BASE = 'https://gradeguru.atayesefm.com.ng'

export function resolveUrl(path) {
  if (!path) return null

  // Already a full URL — return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Root-relative path — prepend production domain
  return `${SITE_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}
