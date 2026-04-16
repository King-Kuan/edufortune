'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  getActiveAcademicYear, createAcademicYear, lockAcademicYear
} from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import type { AcademicYear } from '@/lib/types'

function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', userName: '', schoolName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', userName: '', schoolName: '' }
    const p = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'))
    return { schoolId: p.schoolId ?? '', userName: p.name ?? 'Head Teacher', schoolName: p.schoolName ?? '' }
  } catch { return { schoolId: '', userName: 'Head Teacher', schoolName: '' } }
}

export default function AcademicYearsPage() {
  const { schoolId, userName, schoolName } = useSchoolContext()
  const [years,      setYears]      = useState<AcademicYear[]>([])
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [showForm,   setShowForm]   = useState(false)
  const [newLabel,   setNewLabel]   = useState('')
  const [error,      setError]      = useState('')

  async function loadYears() {
    if (!schoolId) return
    const snap = await getDocs(collection(db, 'schools', schoolId, 'academicYears'))
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }) as AcademicYear)
      .sort((a, b) => b.startYear - a.startYear)
    setYears(all)
    setActiveYear(all.find(y => y.isActive) ?? null)
    setLoading(false)
  }

  useEffect(() => { loadYears() }, [schoolId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!newLabel.match(/^\d{4}-\d{4}$/)) {
      setError('Format must be YYYY-YYYY e.g. 2025-2026')
      return
    }
    const [startStr, endStr] = newLabel.split('-')
    const start = parseInt(startStr)
    const end   = parseInt(endStr)
    if (end !== start + 1) {
      setError('End year must be start year + 1')
      return
    }

    setCreating(true)
    try {
      // Deactivate current active year first
      if (activeYear) {
        await updateDoc(
          doc(db, 'schools', schoolId, 'academicYears', activeYear.id),
          { isActive: false }
        )
      }
      await createAcademicYear(schoolId, {
        schoolId,
        label:       newLabel,
        startYear:   start,
        isActive:    true,
        isLocked:    false,
        currentTerm: 1,
        createdAt:   new Date().toISOString(),
      })
      setNewLabel('')
      setShowForm(false)
      await loadYears()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create academic year')
    } finally {
      setCreating(false)
    }
  }

  async function handleChangeTerm(yearId: string, term: 1 | 2 | 3) {
    await updateDoc(doc(db, 'schools', schoolId, 'academicYears', yearId), { currentTerm: term })
    await loadYears()
  }

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-semibold text-[#e6edf3]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              Academic years
            </h1>
            <p className="text-sm text-[#6e7681] mt-0.5">
              Manage school academic years and terms
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                         bg-[#1565e0] hover:bg-[#1254c0] text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5a.5.5 0 01.5-.5z"/>
              </svg>
              New year
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="surface-card p-5 mb-6">
            <h2 className="text-sm font-medium text-[#cdd9e5] mb-4">New academic year</h2>
            <form onSubmit={handleCreate} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Year label
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] placeholder-[#484f58]
                             focus:outline-none focus:border-[#1565e0] focus:ring-1 focus:ring-[#1565e0]"
                />
                {error && <p className="text-xs text-[#f85149] mt-1">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2.5 rounded-md text-sm font-medium bg-[#1565e0]
                           hover:bg-[#1254c0] text-white disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError('') }}
                className="px-4 py-2.5 rounded-md text-sm font-medium border border-[#30363d]
                           text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Warning about lock */}
        <div className="flex gap-2 p-3 bg-[#1a2d4d] border border-[rgba(88,166,255,0.15)] rounded-md mb-6">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#58a6ff" className="flex-shrink-0 mt-0.5">
            <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z"/>
            <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 11-2 0 1 1 0 012 0z"/>
          </svg>
          <p className="text-xs text-[#58a6ff] leading-relaxed">
            Academic years are locked automatically when Student Annual Reports are generated.
            A new academic year must be created to continue. Class rollover happens during promotion.
          </p>
        </div>

        {/* Years list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-[#1565e0]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : years.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <p className="text-[#484f58] text-sm">No academic years created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {years.map(year => (
              <div key={year.id} className="surface-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-[#e6edf3]">{year.label}</h3>
                    {year.isActive && !year.isLocked && (
                      <span className="badge-optimal">Active</span>
                    )}
                    {year.isLocked && (
                      <span className="text-xs bg-[#21262d] text-[#8b949e] px-2 py-0.5 rounded-full border border-[#30363d]">
                        Locked
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#484f58]">
                    Started {year.startYear}
                  </span>
                </div>

                {/* Term selector */}
                {year.isActive && !year.isLocked && (
                  <div>
                    <p className="text-xs text-[#6e7681] mb-2 uppercase tracking-wider font-medium">
                      Current term
                    </p>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => handleChangeTerm(year.id, t)}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            year.currentTerm === t
                              ? 'bg-[#1565e0] text-white'
                              : 'border border-[#30363d] text-[#8b949e] hover:text-[#cdd9e5] hover:border-[#484f58]'
                          }`}
                        >
                          Term {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!year.isActive && !year.isLocked && (
                  <p className="text-xs text-[#484f58]">Term {year.currentTerm} · Inactive</p>
                )}
                {year.isLocked && (
                  <p className="text-xs text-[#484f58]">Completed — Annual reports generated</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
