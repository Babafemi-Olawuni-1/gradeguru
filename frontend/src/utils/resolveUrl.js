/**
 * Converts a stored image path to a displayable URL.
 *
 * Images are stored as root-relative paths like:
 *   /grade_guru/gradeguru/backend/uploads/logos/school_abc.png
 *
 * They live on the XAMPP server (port 80), not the Vite dev server (port 3000).
 * So we always prepend the current hostname on port 80.
 *
 * This works on any device (laptop, phone) because we use window.location.hostname
 * instead of hardcoding "localhost".
 */
export function resolveUrl(path) {
  if (!path) return null

  // Already a full URL — replace the host:port with hostname:80 to be device-agnostic
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path)
      // Rewrite to current hostname on port 80 (XAMPP)
      return `http://${window.location.hostname}${u.pathname}`
    } catch {
      return path
    }
  }

  // Root-relative path — prepend current hostname on port 80
  return `http://${window.location.hostname}${path}`
}
