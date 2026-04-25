'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { signIn } from '@/lib/firebase/auth'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') ?? ''

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await signIn(email, password)

      // Set session cookie (browser-safe btoa)
      const payload = btoa(
        JSON.stringify({ role: user.role, schoolId: user.schoolId, uid: user.uid, name: user.name })
      )
      document.cookie = `ef-session=${payload}; path=/; SameSite=Strict`

      // First login → force password change
      if (user.isFirstLogin) {
        router.push('/change-password')
        return
      }

      // Role-based redirect
      if (redirect) {
        router.push(redirect)
      } else if (user.role === 'superadmin') {
        router.push('/superadmin')
      } else {
        router.push('/headteacher')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c10] relative overflow-hidden">

      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#1565e0 1px, transparent 1px),
            linear-gradient(90deg, #1565e0 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #1565e0 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #f57c00 0%, transparent 70%)' }}
      />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">

        {/* Logo + brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="EduFortune"
              width={64}
              height={64}
              className="rounded-lg"
            />
          </div>
          <h1
            className="text-2xl font-semibold text-[#e6edf3] tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            EduFortune
          </h1>
          <p className="text-sm text-[#6e7681] mt-1">School Management System</p>
        </div>

        {/* Card */}
        <div className="surface-card p-8">
          <h2 className="text-base font-medium text-[#cdd9e5] mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@school.rw"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                           text-sm text-[#cdd9e5] placeholder-[#484f58]
                           focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                           transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                           text-sm text-[#cdd9e5] placeholder-[#484f58]
                           focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                           transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#f85149] bg-[#2d0f0e]
                              border border-[rgba(248,81,73,0.2)] rounded-md px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 11a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-4.5v-3a.75.75 0 00-1.5 0v3a.75.75 0 001.5 0z"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-2 rounded-md text-sm font-medium
                         bg-[#1565e0] hover:bg-[#1254c0] active:bg-[#0e4299]
                         text-white transition-colors duration-150
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-[#1565e0] focus:ring-offset-2
                         focus:ring-offset-[#161b22]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer branding */}
        <div className="text-center mt-6 flex items-center justify-center gap-2">
          <Image src="/palace.png" alt="The Palace, Inc." width={16} height={16} className="rounded-sm opacity-60" />
          <p className="text-xs text-[#484f58]">
            Powered by <span className="text-[#6e7681]">EduFortune</span>
            {' · '}
            <span className="text-[#6e7681]">The Palace, Inc.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c10]" />}>
      <LoginForm />
    </Suspense>
  )
}
