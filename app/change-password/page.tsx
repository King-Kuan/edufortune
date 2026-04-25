'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, completeFirstLogin } from '@/lib/firebase/auth'
import { readSession, writeSession } from '@/lib/utils/session'
import { EduFortuneLogo } from '@/components/ui/Logos'

export default function ChangePasswordPage() {
  const router = useRouter()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const user = auth.currentUser
      if (!user) { router.push('/login'); return }

      await completeFirstLogin(user, password)

      // Update session to mark first login done
      const session = readSession()
      if (session) writeSession({ ...session })

      // Redirect by role
      const role = session?.role
      router.push(role === 'superadmin' ? '/superadmin' : '/headteacher')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c10]">
      <div className="w-full max-w-md mx-4">

        <div className="text-center mb-8">
          <EduFortuneLogo size={56} className="mx-auto mb-3 rounded-lg" />
          <h1 className="text-xl font-semibold text-[#e6edf3]">Set your password</h1>
          <p className="text-sm text-[#6e7681] mt-1">
            This is your first login. Please set a secure password to continue.
          </p>
        </div>

        <div className="surface-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                           text-sm text-[#cdd9e5] placeholder-[#484f58]
                           focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                           text-sm text-[#cdd9e5] placeholder-[#484f58]
                           focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]"
              />
            </div>

            {error && (
              <p className="text-sm text-[#f85149] bg-[#2d0f0e] border border-[rgba(248,81,73,0.2)]
                            rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium bg-[#1565e0]
                         hover:bg-[#1254c0] text-white disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Saving...' : 'Set password & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
