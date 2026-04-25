'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { generateSchoolAbbreviation } from '@/lib/utils/registration'
import { createSchool } from '@/lib/firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { createUserProfile } from '@/lib/firebase/auth'

export default function NewSchoolPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name:          '',
    abbreviation:  '',
    principalName: '',
    email:         '',
    phone:         '',
  })
  const [abbrevManual, setAbbrevManual] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)

  // Auto-generate abbreviation from name
  useEffect(() => {
    if (!abbrevManual && form.name) {
      setForm(f => ({ ...f, abbreviation: generateSchoolAbbreviation(form.name) }))
    }
  }, [form.name, abbrevManual])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name === 'abbreviation') setAbbrevManual(true)
    setForm(f => ({ ...f, [name]: value }))
  }

  // Generate a secure one-time password
  function generateOTP(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const otp = generateOTP()

    try {
      // 1. Create Firebase Auth account for head teacher
      const credential = await createUserWithEmailAndPassword(auth, form.email, otp)

      // 2. Create school document
      const schoolId = await createSchool({
        name:          form.name,
        abbreviation:  form.abbreviation.toUpperCase(),
        principalName: form.principalName,
        email:         form.email,
        phone:         form.phone,
        status:        'active',
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
      })

      // 3. Create user profile
      await createUserProfile(credential.user.uid, {
        email:         form.email,
        role:          'headteacher',
        schoolId,
        name:          form.principalName,
        isFirstLogin:  true,
      })

      // 4. Send welcome email via API route
      await fetch('/api/emails/school-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:            form.email,
          principalName: form.principalName,
          schoolName:    form.name,
          loginEmail:    form.email,
          otp,
        }),
      })

      setSuccess(true)
      setTimeout(() => router.push('/superadmin/schools'), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create school.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="superadmin" userName="Super Admin">
      <div className="p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-[#6e7681] hover:text-[#cdd9e5] mb-4 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 010 .708L5.707 8l5.647 5.646a.5.5 0 01-.708.708l-6-6a.5.5 0 010-.708l6-6a.5.5 0 01.708 0z"/>
            </svg>
            Back to schools
          </button>
          <h1
            className="text-xl font-semibold text-[#e6edf3]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Register new school
          </h1>
          <p className="text-sm text-[#6e7681] mt-1">
            A one-time login password will be emailed to the principal automatically.
          </p>
        </div>

        {success ? (
          <div className="surface-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#0d2e18] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="#3fb950">
                <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
              </svg>
            </div>
            <h2 className="text-base font-medium text-[#e6edf3] mb-1">School registered successfully</h2>
            <p className="text-sm text-[#6e7681]">
              Login credentials have been sent to <strong className="text-[#cdd9e5]">{form.email}</strong>
            </p>
            <p className="text-xs text-[#484f58] mt-3">Redirecting to schools list...</p>
          </div>
        ) : (
          <div className="surface-card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* School name */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  School name <span className="text-[#f85149]">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Kingdom of Salomon School B"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] placeholder-[#484f58]
                             focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                             transition-colors"
                />
              </div>

              {/* Abbreviation */}
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  School code / abbreviation
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="abbreviation"
                    value={form.abbreviation}
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="Auto-generated"
                    className="w-32 px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] placeholder-[#484f58] uppercase font-mono
                               focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                               transition-colors"
                  />
                  <p className="text-xs text-[#484f58] self-center">
                    Used in student registration numbers. Auto-generated from school name.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#21262d] pt-5">
                <h3 className="text-xs font-semibold text-[#484f58] uppercase tracking-wider mb-4">
                  Principal details
                </h3>

                <div className="space-y-4">
                  {/* Principal name */}
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Full name <span className="text-[#f85149]">*</span>
                    </label>
                    <input
                      type="text"
                      name="principalName"
                      value={form.principalName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Dr. Jean Pierre Uwimana"
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] placeholder-[#484f58]
                                 focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                                 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Email address <span className="text-[#f85149]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="principal@school.rw"
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] placeholder-[#484f58]
                                 focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                                 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Phone number <span className="text-[#f85149]">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="+250 78X XXX XXX"
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] placeholder-[#484f58]
                                 focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]
                                 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="flex gap-2 p-3 bg-[#1a2d4d] border border-[rgba(88,166,255,0.15)] rounded-md">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#58a6ff" className="flex-shrink-0 mt-0.5">
                  <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
                  <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 11-2 0 1 1 0 012 0z"/>
                </svg>
                <p className="text-xs text-[#58a6ff] leading-relaxed">
                  A one-time password will be generated and sent to the principal's email.
                  They will be required to change it on first login.
                </p>
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium
                             border border-[#30363d] text-[#8b949e]
                             hover:border-[#484f58] hover:text-[#cdd9e5]
                             transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium
                             bg-[#1565e0] hover:bg-[#1254c0] text-white
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors"
                >
                  {loading ? 'Registering...' : 'Register school & send credentials'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
