'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getActiveAcademicYear, getClasses, getSubjects } from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/config'
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import type { AcademicYear, Class, Subject } from '@/lib/types'

function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', userName: '', schoolName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', userName: '', schoolName: '' }
    const p = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'))
    return { schoolId: p.schoolId ?? '', userName: p.name ?? 'Head Teacher', schoolName: p.schoolName ?? '' }
  } catch { return { schoolId: '', userName: 'Head Teacher', schoolName: '' } }
}

const DEFAULT_SUBJECTS: Record<string, { name: string; maxMT: number; maxEX: number; isCore: boolean }[]> = {
  N: [
    { name: 'English',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Kinyarwanda',      maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Mathematics',      maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Creative Arts',    maxMT: 20, maxEX: 20,  isCore: false },
  ],
  P: [
    { name: 'English',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Ikinyarwanda',     maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Mathematics',      maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Français',         maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'SET',              maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'Social Studies',   maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'Creative Arts',    maxMT: 10, maxEX: 10,  isCore: false },
    { name: 'Physical Education', maxMT: 10, maxEX: 10, isCore: false },
    { name: 'Swahili',          maxMT: 10, maxEX: 10,  isCore: false },
  ],
  O: [
    { name: 'English',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Ikinyarwanda',     maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Mathematics',      maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'French',           maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'Biology',          maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'Chemistry',        maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'Physics',          maxMT: 40, maxEX: 40,  isCore: true },
    { name: 'History',          maxMT: 40, maxEX: 40,  isCore: false },
    { name: 'Geography',        maxMT: 40, maxEX: 40,  isCore: false },
  ],
  A: [
    { name: 'English',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Mathematics',      maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Physics',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Chemistry',        maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'Biology',          maxMT: 50, maxEX: 50,  isCore: true },
    { name: 'General Studies',  maxMT: 40, maxEX: 40,  isCore: false },
  ],
}

export default function SubjectsPage() {
  const { schoolId, userName, schoolName } = useSchoolContext()
  const searchParams = useSearchParams()
  const preselectedClassId = searchParams.get('classId') ?? ''

  const [activeYear,      setActiveYear]      = useState<AcademicYear | null>(null)
  const [classes,         setClasses]         = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId)
  const [subjects,        setSubjects]        = useState<Subject[]>([])
  const [loading,         setLoading]         = useState(true)
  const [showForm,        setShowForm]        = useState(false)
  const [saving,          setSaving]          = useState(false)

  const [newSubject, setNewSubject] = useState({
    name: '', maxMT: 50, maxEX: 50, isCore: true,
  })

  const selectedClass = classes.find(c => c.id === selectedClassId)

  async function loadSubjects(classId: string) {
    if (!classId || !schoolId) return
    const subs = await getSubjects(schoolId, classId)
    setSubjects(subs)
  }

  useEffect(() => {
    async function init() {
      if (!schoolId) return
      const year = await getActiveAcademicYear(schoolId)
      setActiveYear(year)
      if (year) {
        const cls = await getClasses(schoolId, year.id)
        setClasses(cls)
        const firstId = preselectedClassId || cls[0]?.id || ''
        setSelectedClassId(firstId)
        if (firstId) await loadSubjects(firstId)
      }
      setLoading(false)
    }
    init()
  }, [schoolId])

  useEffect(() => {
    loadSubjects(selectedClassId)
  }, [selectedClassId])

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClassId || !schoolId) return
    setSaving(true)
    await addDoc(collection(db, 'schools', schoolId, 'subjects'), {
      schoolId,
      classId:       selectedClassId,
      name:          newSubject.name,
      maxMT:         newSubject.maxMT,
      maxEX:         newSubject.maxEX,
      order:         subjects.length + 1,
      isCoreSubject: newSubject.isCore,
    })
    await loadSubjects(selectedClassId)
    setNewSubject({ name: '', maxMT: 50, maxEX: 50, isCore: true })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(subjectId: string) {
    if (!confirm('Remove this subject?')) return
    await deleteDoc(doc(db, 'schools', schoolId, 'subjects', subjectId))
    await loadSubjects(selectedClassId)
  }

  async function handleLoadDefaults() {
    if (!selectedClass || !selectedClassId || !schoolId) return
    if (!confirm('This will add the default REB subjects. Any existing subjects will remain.')) return
    setSaving(true)
    const defaults = DEFAULT_SUBJECTS[selectedClass.levelCode] ?? []
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i]
      await addDoc(collection(db, 'schools', schoolId, 'subjects'), {
        schoolId,
        classId:       selectedClassId,
        name:          d.name,
        maxMT:         d.maxMT,
        maxEX:         d.maxEX,
        order:         subjects.length + i + 1,
        isCoreSubject: d.isCore,
      })
    }
    await loadSubjects(selectedClassId)
    setSaving(false)
  }

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-xl font-semibold text-[#e6edf3]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            Subjects
          </h1>
          <p className="text-sm text-[#6e7681] mt-0.5">
            Configure subjects and mark allocations per class
          </p>
        </div>

        {/* Class selector */}
        <div className="surface-card p-4 mb-6">
          <label className="block text-xs font-medium text-[#8b949e] mb-2 uppercase tracking-wider">
            Select class
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedClassId === cls.id
                    ? 'bg-[#1565e0] text-white'
                    : 'border border-[#30363d] text-[#8b949e] hover:text-[#cdd9e5] hover:border-[#484f58]'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {selectedClass && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-[#cdd9e5]">
                  {selectedClass.name} subjects
                </h2>
                <p className="text-xs text-[#6e7681] mt-0.5">
                  Max total = MAX MT + MAX EX per subject
                </p>
              </div>
              <div className="flex gap-2">
                {subjects.length === 0 && (
                  <button
                    onClick={handleLoadDefaults}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#30363d]
                               text-[#8b949e] hover:text-[#cdd9e5] hover:border-[#484f58] transition-colors"
                  >
                    Load REB defaults
                  </button>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#1565e0]
                             hover:bg-[#1254c0] text-white transition-colors"
                >
                  + Add subject
                </button>
              </div>
            </div>

            {/* Add subject form */}
            {showForm && (
              <div className="surface-card p-4 mb-4">
                <form onSubmit={handleAddSubject} className="grid grid-cols-4 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Subject name
                    </label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))}
                      required
                      placeholder="e.g. Mathematics"
                      className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Max MT
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSubject.maxMT}
                      onChange={e => setNewSubject(s => ({ ...s, maxMT: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Max EX
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newSubject.maxEX}
                      onChange={e => setNewSubject(s => ({ ...s, maxEX: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCore"
                      checked={newSubject.isCore}
                      onChange={e => setNewSubject(s => ({ ...s, isCore: e.target.checked }))}
                      className="accent-[#1565e0]"
                    />
                    <label htmlFor="isCore" className="text-xs text-[#8b949e]">Core subject</label>
                  </div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-2 text-sm border border-[#30363d] rounded-md
                                 text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-2 text-sm bg-[#1565e0] hover:bg-[#1254c0]
                                 text-white rounded-md disabled:opacity-50 transition-colors"
                    >
                      {saving ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subjects table */}
            <div className="surface-card overflow-hidden">
              {subjects.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-[#484f58]">
                    No subjects yet. Add subjects or load REB defaults.
                  </p>
                </div>
              ) : (
                <table className="ef-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Max MT</th>
                      <th>Max EX</th>
                      <th>Max Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, i) => (
                      <tr key={s.id}>
                        <td className="text-[#484f58] tabular-nums">{i + 1}</td>
                        <td className="font-medium text-[#cdd9e5]">{s.name}</td>
                        <td>
                          {s.isCoreSubject
                            ? <span className="text-xs text-[#3fb950] bg-[#0d2e18] px-1.5 py-0.5 rounded">Core</span>
                            : <span className="text-xs text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded">Optional</span>
                          }
                        </td>
                        <td className="tabular-nums">{s.maxMT}</td>
                        <td className="tabular-nums">{s.maxEX}</td>
                        <td className="font-medium text-[#e6edf3] tabular-nums">{s.maxMT + s.maxEX}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-xs text-[#484f58] hover:text-[#f85149] transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-[#161b22]">
                      <td colSpan={3} className="font-medium text-[#8b949e] text-right pr-4">Total</td>
                      <td className="font-semibold text-[#e6edf3] tabular-nums">
                        {subjects.reduce((s, x) => s + x.maxMT, 0)}
                      </td>
                      <td className="font-semibold text-[#e6edf3] tabular-nums">
                        {subjects.reduce((s, x) => s + x.maxEX, 0)}
                      </td>
                      <td className="font-semibold text-[#58a6ff] tabular-nums">
                        {subjects.reduce((s, x) => s + x.maxMT + x.maxEX, 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
