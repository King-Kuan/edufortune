'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getActiveAcademicYear, getClasses, getTeachers, createClass } from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore'
import type { AcademicYear, Class, Level, Teacher, LevelCode, LevelName } from '@/lib/types'

function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', userName: '', schoolName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', userName: '', schoolName: '' }
    const p = JSON.parse(atob(session))
    return { schoolId: p.schoolId ?? '', userName: p.name ?? 'Head Teacher', schoolName: p.schoolName ?? '' }
  } catch { return { schoolId: '', userName: 'Head Teacher', schoolName: '' } }
}

const LEVEL_DEFINITIONS: { code: LevelCode; name: LevelName; classes: string[]; order: number }[] = [
  { code: 'N', name: 'Nursery',  classes: ['N1','N2','N3'],                         order: 1 },
  { code: 'P', name: 'Primary',  classes: ['P1','P2','P3','P4','P5','P6'],           order: 2 },
  { code: 'O', name: 'Ordinary', classes: ['S1','S2','S3'],                          order: 3 },
  { code: 'A', name: 'Advanced', classes: ['S4','S5','S6'],                          order: 4 },
]

export default function ClassesPage() {
  const { schoolId, userName, schoolName } = useSchoolContext()

  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null)
  const [levels,     setLevels]     = useState<Level[]>([])
  const [classes,    setClasses]    = useState<Class[]>([])
  const [teachers,   setTeachers]   = useState<Teacher[]>([])
  const [loading,    setLoading]    = useState(true)

  // Add class form
  const [showForm,    setShowForm]    = useState(false)
  const [formLevel,   setFormLevel]   = useState<LevelCode>('P')
  const [formClass,   setFormClass]   = useState('P1')
  const [formTeacher, setFormTeacher] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function load() {
    if (!schoolId) return
    const year = await getActiveAcademicYear(schoolId)
    setActiveYear(year)
    if (year) {
      const cls = await getClasses(schoolId, year.id)
      setClasses(cls)
    }
    // Load levels
    const lvlSnap = await getDocs(collection(db, 'schools', schoolId, 'levels'))
    setLevels(lvlSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Level))

    const tch = await getTeachers(schoolId)
    setTeachers(tch)
    setLoading(false)
  }

  useEffect(() => { load() }, [schoolId])

  // Get or create level for a code
  async function ensureLevel(code: LevelCode, name: LevelName, order: number): Promise<string> {
    const existing = levels.find(l => l.code === code)
    if (existing) return existing.id
    const ref = await addDoc(collection(db, 'schools', schoolId, 'levels'), {
      schoolId, name, code, order
    })
    return ref.id
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!activeYear) { setError('No active academic year'); return }

    // Check duplicate
    if (classes.find(c => c.name === formClass && c.academicYearId === activeYear.id)) {
      setError(`${formClass} already exists this year`)
      return
    }

    setSaving(true)
    try {
      const def     = LEVEL_DEFINITIONS.find(l => l.code === formLevel)!
      const levelId = await ensureLevel(formLevel, def.name, def.order)
      const num     = parseInt(formClass.replace(/\D/g, ''))

      await createClass(schoolId, {
        schoolId,
        levelId,
        levelCode:      formLevel,
        name:           formClass,
        classNumber:    num,
        classTeacherId: formTeacher || undefined,
        academicYearId: activeYear.id,
        studentCount:   0,
      })
      await load()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssignTeacher(classId: string, teacherId: string) {
    await updateDoc(doc(db, 'schools', schoolId, 'classes', classId), {
      classTeacherId: teacherId || null
    })
    await load()
  }

  // Group classes by level
  const grouped = LEVEL_DEFINITIONS.map(def => ({
    ...def,
    items: classes.filter(c => c.levelCode === def.code),
  })).filter(g => g.items.length > 0)

  // Available class names for selected level
  const availableClasses = LEVEL_DEFINITIONS
    .find(l => l.code === formLevel)?.classes
    .filter(cn => !classes.find(c => c.name === cn && c.academicYearId === activeYear?.id))
    ?? []

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-semibold text-[#e6edf3]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              Classes
            </h1>
            <p className="text-sm text-[#6e7681] mt-0.5">
              {activeYear ? `Academic year ${activeYear.label}` : 'No active academic year'}
            </p>
          </div>
          {activeYear && !activeYear.isLocked && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                         bg-[#1565e0] hover:bg-[#1254c0] text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1.5a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5a.5.5 0 01.5-.5z"/>
              </svg>
              Add class
            </button>
          )}
        </div>

        {/* Add class form */}
        {showForm && (
          <div className="surface-card p-5 mb-6">
            <h2 className="text-sm font-medium text-[#cdd9e5] mb-4">Add new class</h2>
            <form onSubmit={handleAddClass} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Level
                </label>
                <select
                  value={formLevel}
                  onChange={e => {
                    const code = e.target.value as LevelCode
                    setFormLevel(code)
                    const first = LEVEL_DEFINITIONS.find(l => l.code === code)?.classes[0] ?? ''
                    setFormClass(first)
                  }}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                >
                  {LEVEL_DEFINITIONS.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Class
                </label>
                <select
                  value={formClass}
                  onChange={e => setFormClass(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                >
                  {availableClasses.length === 0 ? (
                    <option value="">All classes added</option>
                  ) : (
                    availableClasses.map(cn => (
                      <option key={cn} value={cn}>{cn}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                  Class teacher (optional)
                </label>
                <select
                  value={formTeacher}
                  onChange={e => setFormTeacher(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                             text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                >
                  <option value="">— Assign later —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="col-span-3 text-xs text-[#f85149]">{error}</div>
              )}

              <div className="col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={saving || availableClasses.length === 0}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-[#1565e0]
                             hover:bg-[#1254c0] text-white disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Adding...' : 'Add class'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError('') }}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-[#30363d]
                             text-[#8b949e] hover:text-[#cdd9e5] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-[#1565e0]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : !activeYear ? (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-[#484f58]">Set up an academic year first.</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-[#484f58]">No classes added yet. Add your first class above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(group => (
              <div key={group.code}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#484f58] uppercase tracking-widest">
                    {group.name} level
                  </span>
                  <span className="text-xs text-[#30363d]">({group.items.length} class{group.items.length !== 1 ? 'es' : ''})</span>
                </div>
                <div className="surface-card overflow-hidden">
                  <table className="ef-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Students</th>
                        <th>Class teacher</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(cls => {
                        const teacher = teachers.find(t => t.id === cls.classTeacherId)
                        return (
                          <tr key={cls.id}>
                            <td>
                              <span className="font-semibold text-[#e6edf3]">{cls.name}</span>
                            </td>
                            <td className="tabular-nums">{cls.studentCount}</td>
                            <td>
                              {activeYear.isLocked ? (
                                <span className="text-[#6e7681]">{teacher?.name ?? '—'}</span>
                              ) : (
                                <select
                                  value={cls.classTeacherId ?? ''}
                                  onChange={e => handleAssignTeacher(cls.id, e.target.value)}
                                  className="bg-transparent text-sm text-[#cdd9e5] border-0 focus:outline-none
                                             hover:text-white cursor-pointer"
                                >
                                  <option value="">— Unassigned —</option>
                                  {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td>
                              <a
                                href={`/headteacher/subjects?classId=${cls.id}`}
                                className="text-xs text-[#1565e0] hover:underline"
                              >
                                Subjects
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
