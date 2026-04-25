'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getTeachers } from '@/lib/firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { createUserProfile } from '@/lib/firebase/auth'
import { db } from '@/lib/firebase/config'
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import type { Teacher } from '@/lib/types'

function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', userName: '', schoolName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', userName: '', schoolName: '' }
    const p = JSON.parse(atob(session))
    return { schoolId: p.schoolId ?? '', userName: p.name ?? 'Head Teacher', schoolName: p.schoolName ?? '' }
  } catch { return { schoolId: '', userName: 'Head Teacher', schoolName: '' } }
}

function generateOTP(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function TeachersPage() {
  const { schoolId, userName, schoolName } = useSchoolContext()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  const [form, setForm] = useState({
    name:  '',
    email: '',
    phone: '',
    role:  'teacher' as 'teacher' | 'headteacher',
  })

  async function load() {
    if (!schoolId) return
    const t = await getTeachers(schoolId)
    setTeachers(t)
    setLoading(false)
  }

  useEffect(() => { load() }, [schoolId])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const otp = generateOTP()

    try {
      // Create Firebase Auth account
      const credential = await createUserWithEmailAndPassword(auth, form.email, otp)

      // Create teacher document in school
      const ref = await addDoc(collection(db, 'schools', schoolId, 'teachers'), {
        schoolId,
        uid:              credential.user.uid,
        name:             form.name,
        email:            form.email,
        phone:            form.phone,
        role:             form.role,
        assignedClassIds:   [],
        assignedSubjectIds: [],
        isActive:         true,
        createdAt:        serverTimestamp(),
      })

      // Create user profile
      await createUserProfile(credential.user.uid, {
        email:        form.email,
        role:         form.role,
        schoolId,
        name:         form.name,
        isFirstLogin: true,
      })

      // Send invite email
      await fetch('/api/emails/teacher-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:          form.email,
          teacherName: form.name,
          schoolName,
          loginEmail:  form.email,
          otp,
          appUrl:      'https://classroom.edufortune.com',
        }),
      })

      setSuccess(`Invitation sent to ${form.name} at ${form.email}`)
      setForm({ name: '', email: '', phone: '', role: 'teacher' })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite teacher')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(teacherId: string, uid: string) {
    if (!confirm('Deactivate this teacher? They will lose access.')) return
    await updateDoc(doc(db, 'schools', schoolId, 'teachers', teacherId), { isActive: false })
    await load()
  }

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-semibold text-[#e6edf3]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              Teachers
            </h1>
            <p className="text-sm text-[#6e7681] mt-0.5">
              Invite and manage your teaching staff
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setSuccess('') }}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                       bg-[#1565e0] hover:bg-[#1254c0] text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5a.5.5 0 01.5-.5z"/>
            </svg>
            Invite teacher
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-[#0d2e18] border border-[rgba(63,185,80,0.2)]
                          rounded-md text-sm text-[#3fb950]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
            </svg>
            {success}
          </div>
        )}

        {/* Invite form */}
        {showForm && (
          <div className="surface-card p-5 mb-6">
            <h2 className="text-sm font-medium text-[#cdd9e5] mb-4">Invite new teacher</h2>
            <form onSubmit={handleInvite} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Full name <span className="text-[#f85149]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Marie Claire Uwera"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] placeholder-[#484f58]
                             focus:outline-none focus:border-[#1565e0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Email address <span className="text-[#f85149]">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="teacher@school.rw"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] placeholder-[#484f58]
                             focus:outline-none focus:border-[#1565e0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+250 78X XXX XXX"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] placeholder-[#484f58]
                             focus:outline-none focus:border-[#1565e0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'teacher' | 'headteacher' }))}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                >
                  <option value="teacher">Teacher</option>
                  <option value="headteacher">Head Teacher</option>
                </select>
              </div>

              {error && (
                <div className="col-span-2 text-xs text-[#f85149] bg-[#2d0f0e] border border-[rgba(248,81,73,0.2)] rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-md text-sm font-medium bg-[#1565e0]
                             hover:bg-[#1254c0] text-white disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Sending invite...' : 'Send invite & create account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="px-4 py-2.5 rounded-md text-sm font-medium border border-[#30363d]
                             text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teachers table */}
        <div className="surface-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-[#1565e0]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#484f58]">No teachers yet. Invite your first teacher above.</p>
            </div>
          ) : (
            <table className="ef-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium text-[#cdd9e5]">{t.name}</td>
                    <td className="text-[#8b949e]">{t.email}</td>
                    <td className="text-[#6e7681]">{t.phone || '—'}</td>
                    <td>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.role === 'headteacher'
                          ? 'text-[#58a6ff] bg-[#1a2d4d]'
                          : 'text-[#8b949e] bg-[#21262d]'
                      }`}>
                        {t.role === 'headteacher' ? 'Head Teacher' : 'Teacher'}
                      </span>
                    </td>
                    <td>
                      {t.isActive
                        ? <span className="badge-optimal">Active</span>
                        : <span className="text-xs text-[#484f58]">Inactive</span>
                      }
                    </td>
                    <td>
                      {t.isActive && (
                        <button
                          onClick={() => handleDeactivate(t.id, t.uid)}
                          className="text-xs text-[#484f58] hover:text-[#f85149] transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
