'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getActiveAcademicYear, getClasses, createStudent } from '@/lib/firebase/firestore'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore'
import { generateRegistrationNumber } from '@/lib/utils/registration'
import type { AcademicYear, Class, Student } from '@/lib/types'

function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', schoolCode: '', userName: '', schoolName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', schoolCode: '', userName: '', schoolName: '' }
    const p = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'))
    return {
      schoolId:   p.schoolId ?? '',
      schoolCode: p.schoolCode ?? '',
      userName:   p.name ?? 'Head Teacher',
      schoolName: p.schoolName ?? '',
    }
  } catch { return { schoolId: '', schoolCode: '', userName: 'Head Teacher', schoolName: '' } }
}

export default function StudentsPage() {
  const { schoolId, schoolCode, userName, schoolName } = useSchoolContext()

  const [activeYear,      setActiveYear]      = useState<AcademicYear | null>(null)
  const [classes,         setClasses]         = useState<Class[]>([])
  const [students,        setStudents]        = useState<Student[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading,         setLoading]         = useState(true)
  const [showForm,        setShowForm]        = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState('')

  const [form, setForm] = useState({
    firstName:   '',
    lastName:    '',
    dateOfBirth: '',
    gender:      '' as 'M' | 'F' | '',
    parentName:  '',
    parentPhone: '',
    parentEmail: '',
    classId:     '',
  })

  async function loadStudents(classId: string) {
    if (!classId || !schoolId) return
    const snap = await getDocs(
      query(
        collection(db, 'schools', schoolId, 'students'),
        where('classId', '==', classId)
      )
    )
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Student))
  }

  useEffect(() => {
    async function init() {
      if (!schoolId) return
      const year = await getActiveAcademicYear(schoolId)
      setActiveYear(year)
      if (year) {
        const cls = await getClasses(schoolId, year.id)
        setClasses(cls)
        if (cls.length > 0) {
          setSelectedClassId(cls[0].id)
          await loadStudents(cls[0].id)
        }
      }
      setLoading(false)
    }
    init()
  }, [schoolId])

  useEffect(() => {
    loadStudents(selectedClassId)
  }, [selectedClassId])

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!activeYear || !form.classId) { setError('Select a class'); return }
    setSaving(true)

    try {
      const cls = classes.find(c => c.id === form.classId)!

      // Gather existing reg numbers for uniqueness
      const snap = await getDocs(collection(db, 'schools', schoolId, 'students'))
      const existing = new Set(snap.docs.map(d => d.data().registrationNumber as string))

      const regNumber = generateRegistrationNumber(
        schoolCode || 'SCH',
        activeYear.startYear,
        cls.levelCode,
        cls.classNumber,
        existing
      )

      const studentId = await createStudent(schoolId, {
        schoolId,
        classId:            form.classId,
        academicYearId:     activeYear.id,
        registrationNumber: regNumber,
        firstName:          form.firstName,
        lastName:           form.lastName,
        dateOfBirth:        form.dateOfBirth,
        gender:             form.gender || undefined,
        parentName:         form.parentName,
        parentPhone:        form.parentPhone,
        parentEmail:        form.parentEmail,
        enrolledAt:         new Date().toISOString(),
      })

      // Update class student count
      await updateDoc(doc(db, 'schools', schoolId, 'classes', form.classId), {
        studentCount: (cls.studentCount ?? 0) + 1,
      })

      setForm({
        firstName: '', lastName: '', dateOfBirth: '', gender: '',
        parentName: '', parentPhone: '', parentEmail: '', classId: form.classId,
      })
      setShowForm(false)
      await loadStudents(selectedClassId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll student')
    } finally {
      setSaving(false)
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-semibold text-[#e6edf3]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              Students
            </h1>
            <p className="text-sm text-[#6e7681] mt-0.5">
              Enroll and manage students · {activeYear?.label ?? 'No active year'}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setForm(f => ({ ...f, classId: selectedClassId })) }}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                       bg-[#1565e0] hover:bg-[#1254c0] text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5a.5.5 0 01.5-.5z"/>
            </svg>
            Enroll student
          </button>
        </div>

        {/* Class selector */}
        <div className="flex flex-wrap gap-2 mb-6">
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
              <span className="ml-1.5 text-xs opacity-60">({cls.studentCount})</span>
            </button>
          ))}
        </div>

        {/* Enrollment form */}
        {showForm && (
          <div className="surface-card p-5 mb-6">
            <h2 className="text-sm font-medium text-[#cdd9e5] mb-4">Enroll new student</h2>
            <form onSubmit={handleEnroll} className="space-y-4">

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                    First name <span className="text-[#f85149]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                    Last name <span className="text-[#f85149]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                    Assign to class <span className="text-[#f85149]">*</span>
                  </label>
                  <select
                    value={form.classId}
                    onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                  >
                    <option value="">Select class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'M' | 'F' | '' }))}
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                               text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                  >
                    <option value="">Not specified</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              {/* Parent info */}
              <div className="border-t border-[#21262d] pt-4">
                <p className="text-xs font-medium text-[#484f58] uppercase tracking-wider mb-3">
                  Parent / Guardian
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.parentName}
                      onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.parentPhone}
                      onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b949e] mb-1.5 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.parentEmail}
                      onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-md
                                 text-sm text-[#cdd9e5] focus:outline-none focus:border-[#1565e0]"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-[#f85149]">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-md text-sm font-medium bg-[#1565e0]
                             hover:bg-[#1254c0] text-white disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Enrolling...' : 'Enroll student'}
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

        {/* Students table */}
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#21262d] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#cdd9e5]">
              {selectedClass?.name ?? 'Select a class'} · {students.length} students
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-[#1565e0]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#484f58]">No students enrolled in this class yet.</p>
            </div>
          ) : (
            <table className="ef-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Reg. number</th>
                  <th>Gender</th>
                  <th>Parent phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-[#484f58] tabular-nums">{i + 1}</td>
                    <td className="font-medium text-[#cdd9e5]">
                      {s.lastName} {s.firstName}
                    </td>
                    <td>
                      <code className="text-xs bg-[#21262d] px-1.5 py-0.5 rounded text-[#8b949e] font-mono">
                        {s.registrationNumber}
                      </code>
                    </td>
                    <td className="text-[#6e7681]">{s.gender ?? '—'}</td>
                    <td className="text-[#6e7681]">{s.parentPhone || '—'}</td>
                    <td>
                      <a
                        href={`/headteacher/students/${s.id}`}
                        className="text-xs text-[#1565e0] hover:underline"
                      >
                        View
                      </a>
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
