'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getSchoolSummaries } from '@/lib/firebase/firestore'
import type { SchoolSummary } from '@/lib/types'

const HEALTH_CONFIG = {
  below_optimal: { label: 'Below Optimal', className: 'badge-below',   threshold: '< 300 students' },
  optimal:       { label: 'Optimal Range', className: 'badge-optimal', threshold: '300–900 students' },
  crowded:       { label: 'Crowded',       className: 'badge-crowded', threshold: '> 1000 students' },
}

export default function SuperAdminDashboard() {
  const [summaries, setSummaries] = useState<SchoolSummary[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getSchoolSummaries()
      .then(setSummaries)
      .finally(() => setLoading(false))
  }, [])

  const totalStudents  = summaries.reduce((s, x) => s + x.totalStudents, 0)
  const totalTeachers  = summaries.reduce((s, x) => s + x.activeTeachers, 0)
  const belowOptimal   = summaries.filter(s => s.healthStatus === 'below_optimal').length
  const crowded        = summaries.filter(s => s.healthStatus === 'crowded').length

  return (
    <DashboardLayout role="superadmin" userName="Super Admin">
      <div className="p-6 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-xl font-semibold text-[#e6edf3]"
              style={{ fontFamily: 'var(--font-plus-jakarta)' }}
            >
              System Overview
            </h1>
            <p className="text-sm text-[#6e7681] mt-0.5">
              All schools on EduFortune platform
            </p>
          </div>
          <Link
            href="/superadmin/schools/new"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                       bg-[#1565e0] hover:bg-[#1254c0] text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5a.5.5 0 01.5-.5z"/>
            </svg>
            Add school
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total schools',  value: summaries.length,  color: '#58a6ff' },
            { label: 'Total students', value: totalStudents,      color: '#3fb950' },
            { label: 'Active teachers', value: totalTeachers,    color: '#f0883e' },
            {
              label: 'Alerts',
              value: belowOptimal + crowded,
              color: belowOptimal + crowded > 0 ? '#f85149' : '#3fb950',
              sub:   belowOptimal + crowded > 0
                ? `${belowOptimal} below optimal · ${crowded} crowded`
                : 'All schools healthy',
            },
          ].map(stat => (
            <div key={stat.label} className="surface-card p-4">
              <p className="text-xs text-[#6e7681] font-medium uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold" style={{ color: stat.color }}>
                {loading ? '—' : stat.value.toLocaleString()}
              </p>
              {stat.sub && (
                <p className="text-xs text-[#484f58] mt-1">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Health legend */}
        <div className="flex items-center gap-4 mb-4">
          <p className="text-xs text-[#484f58] font-medium uppercase tracking-wider">Health guide</p>
          {Object.values(HEALTH_CONFIG).map(h => (
            <div key={h.label} className="flex items-center gap-2">
              <span className={h.className}>{h.label}</span>
              <span className="text-xs text-[#484f58]">{h.threshold}</span>
            </div>
          ))}
        </div>

        {/* Schools table */}
        <div className="surface-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#21262d] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#cdd9e5]">All schools</h2>
            <span className="text-xs text-[#484f58]">{summaries.length} registered</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin w-6 h-6 text-[#1565e0]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm text-[#484f58]">Loading schools...</p>
              </div>
            </div>
          ) : summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <svg width="40" height="40" viewBox="0 0 16 16" fill="#30363d">
                <path d="M2 1a1 1 0 011-1h10a1 1 0 011 1v14H2V1zm3 2v2h2V3H5zm4 0v2h2V3H9zm-4 4v2h2V7H5zm4 0v2h2V7H9zm-4 4v3h2v-3H5zm4 0v3h2v-3H9z"/>
              </svg>
              <p className="text-sm text-[#484f58]">No schools registered yet</p>
              <Link
                href="/superadmin/schools/new"
                className="text-sm text-[#1565e0] hover:underline"
              >
                Add your first school
              </Link>
            </div>
          ) : (
            <table className="ef-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Code</th>
                  <th>Students</th>
                  <th>Teachers</th>
                  <th>Academic year</th>
                  <th>Health</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(school => {
                  const health = HEALTH_CONFIG[school.healthStatus]
                  return (
                    <tr key={school.schoolId}>
                      <td>
                        <span className="font-medium text-[#cdd9e5]">{school.schoolName}</span>
                      </td>
                      <td>
                        <code className="text-xs bg-[#21262d] px-1.5 py-0.5 rounded text-[#8b949e]">
                          {school.abbreviation}
                        </code>
                      </td>
                      <td className="tabular-nums">{school.totalStudents.toLocaleString()}</td>
                      <td className="tabular-nums">{school.activeTeachers}</td>
                      <td className="text-[#8b949e]">
                        {school.currentAcademicYear ?? '—'}
                      </td>
                      <td>
                        <span className={health.className}>{health.label}</span>
                      </td>
                      <td>
                        <Link
                          href={`/superadmin/schools/${school.schoolId}`}
                          className="text-xs text-[#1565e0] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
