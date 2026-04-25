'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getActiveAcademicYear, getClasses, getTeachers, getStudents } from '@/lib/firebase/firestore'
import type { AcademicYear, Class } from '@/lib/types'

// Read school context from session (set after login)
function useSchoolContext() {
  if (typeof window === 'undefined') return { schoolId: '', schoolName: '', userName: '' }
  try {
    const session = document.cookie.split('; ').find(r => r.startsWith('ef-session='))?.split('=')[1]
    if (!session) return { schoolId: '', schoolName: '', userName: '' }
    const payload = JSON.parse(atob(session))
    return {
      schoolId:   payload.schoolId ?? '',
      schoolName: payload.schoolName ?? '',
      userName:   payload.name ?? 'Head Teacher',
    }
  } catch { return { schoolId: '', schoolName: '', userName: 'Head Teacher' } }
}

interface QuickStat { label: string; value: string | number; sub?: string; color: string }

export default function HeadTeacherDashboard() {
  const { schoolId, schoolName, userName } = useSchoolContext()

  const [activeYear,    setActiveYear]    = useState<AcademicYear | null>(null)
  const [classes,       setClasses]       = useState<Class[]>([])
  const [teacherCount,  setTeacherCount]  = useState(0)
  const [studentCount,  setStudentCount]  = useState(0)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!schoolId) return
    async function load() {
      const year = await getActiveAcademicYear(schoolId)
      setActiveYear(year)

      if (year) {
        const cls = await getClasses(schoolId, year.id)
        setClasses(cls)

        // Count students across all classes
        let total = 0
        for (const c of cls) {
          total += c.studentCount
        }
        setStudentCount(total)
      }

      const teachers = await getTeachers(schoolId)
      setTeacherCount(teachers.length)
      setLoading(false)
    }
    load()
  }, [schoolId])

  const stats: QuickStat[] = [
    {
      label: 'Academic year',
      value: activeYear?.label ?? 'Not set',
      sub:   activeYear ? `Term ${activeYear.currentTerm} · ${activeYear.isLocked ? 'Locked' : 'Active'}` : 'Set up an academic year to begin',
      color: activeYear ? '#58a6ff' : '#d29922',
    },
    {
      label:  'Total students',
      value:  studentCount,
      sub:    `Across ${classes.length} class${classes.length !== 1 ? 'es' : ''}`,
      color:  '#3fb950',
    },
    {
      label:  'Teachers',
      value:  teacherCount,
      color:  '#f0883e',
    },
    {
      label:  'Current term',
      value:  activeYear ? `Term ${activeYear.currentTerm}` : '—',
      sub:    'of 3 terms',
      color:  '#a371f7',
    },
  ]

  const quickActions = [
    { label: 'Enroll student',    href: '/headteacher/students/new',      icon: '👤' },
    { label: 'Add teacher',       href: '/headteacher/teachers/new',       icon: '🧑‍🏫' },
    { label: 'Enter marks',       href: '/headteacher/marks',              icon: '✏️' },
    { label: 'Generate reports',  href: '/headteacher/reports',            icon: '📄' },
    { label: 'View attendance',   href: '/headteacher/attendance',         icon: '✅' },
    { label: 'Promote students',  href: '/headteacher/promotions',         icon: '⬆️' },
  ]

  return (
    <DashboardLayout role="headteacher" userName={userName} schoolName={schoolName}>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-xl font-semibold text-[#e6edf3]"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            {schoolName || 'School Dashboard'}
          </h1>
          <p className="text-sm text-[#6e7681] mt-0.5">
            Welcome back, {userName}
          </p>
        </div>

        {/* Setup prompt if no academic year */}
        {!loading && !activeYear && (
          <div className="mb-6 p-4 bg-[#2d2000] border border-[rgba(210,153,34,0.25)] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="#d29922">
                <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-[#d29922]">No active academic year</p>
                <p className="text-xs text-[#8b949e]">Set up an academic year to start managing your school</p>
              </div>
            </div>
            <Link
              href="/headteacher/academic-years"
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-[#d29922] text-[#0d1117] hover:bg-[#b8841c] transition-colors"
            >
              Set up now
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="surface-card p-4">
              <p className="text-xs text-[#6e7681] font-medium uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold truncate" style={{ color: stat.color }}>
                {loading ? '—' : stat.value}
              </p>
              {stat.sub && (
                <p className="text-xs text-[#484f58] mt-1 leading-relaxed">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[#8b949e] uppercase tracking-wider mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="surface-card p-4 flex flex-col items-center gap-2 text-center
                           hover:border-[#30363d] hover:bg-[#21262d] transition-colors group"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-xs text-[#8b949e] group-hover:text-[#cdd9e5] transition-colors leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Classes overview */}
        {classes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-[#8b949e] uppercase tracking-wider">
                Classes this year
              </h2>
              <Link href="/headteacher/classes" className="text-xs text-[#1565e0] hover:underline">
                Manage classes
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {classes.map(cls => (
                <div key={cls.id} className="surface-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-[#e6edf3]">{cls.name}</span>
                    <span className="text-xs text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded">
                      {cls.levelCode}
                    </span>
                  </div>
                  <p className="text-xs text-[#6e7681]">
                    {cls.studentCount} student{cls.studentCount !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
