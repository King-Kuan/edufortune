'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/firebase/auth'

// ─── Nav config ───────────────────────────────────────────────────────────────
const SUPERADMIN_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',  href: '/superadmin',         icon: GridIcon },
      { label: 'Schools',    href: '/superadmin/schools',  icon: BuildingIcon },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Settings',   href: '/superadmin/settings', icon: SettingsIcon },
    ],
  },
]

const HEADTEACHER_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',       href: '/headteacher',                  icon: GridIcon },
      { label: 'Academic Year',   href: '/headteacher/academic-years',   icon: CalendarIcon },
    ],
  },
  {
    section: 'Setup',
    items: [
      { label: 'Classes',         href: '/headteacher/classes',          icon: LayersIcon },
      { label: 'Subjects',        href: '/headteacher/subjects',         icon: BookIcon },
      { label: 'Teachers',        href: '/headteacher/teachers',         icon: UsersIcon },
    ],
  },
  {
    section: 'Students',
    items: [
      { label: 'Students',        href: '/headteacher/students',         icon: UserIcon },
      { label: 'Attendance',      href: '/headteacher/attendance',       icon: CheckSquareIcon },
      { label: 'Marks',           href: '/headteacher/marks',            icon: EditIcon },
      { label: 'Promotions',      href: '/headteacher/promotions',       icon: ArrowUpIcon },
    ],
  },
  {
    section: 'Reports',
    items: [
      { label: 'Reports',         href: '/headteacher/reports',          icon: FileTextIcon },
    ],
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'superadmin' | 'headteacher'
  userName: string
  schoolName?: string
}

export default function DashboardLayout({
  children,
  role,
  userName,
  schoolName,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const nav      = role === 'superadmin' ? SUPERADMIN_NAV : HEADTEACHER_NAV

  async function handleSignOut() {
    await signOut()
    document.cookie = 'ef-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-[#080c10] border-r border-[#21262d]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#21262d]">
          <img src="/logo.png" alt="EduFortune" width={28} height={28} className="rounded" />
          <span
            className="text-sm font-semibold text-[#e6edf3] tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            EduFortune
          </span>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1a2d4d] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-[#1565e0] uppercase">
                {userName.charAt(0)}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-[#cdd9e5] truncate">{userName}</p>
              {schoolName && (
                <p className="text-[10px] text-[#6e7681] truncate">{schoolName}</p>
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              role === 'superadmin'
                ? 'bg-[#1a2d4d] text-[#58a6ff]'
                : 'bg-[#1a3020] text-[#3fb950]'
            }`}>
              {role === 'superadmin' ? 'Super Admin' : 'Head Teacher'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {nav.map(section => (
            <div key={section.section}>
              <p className="px-2 mb-1 text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon    = item.icon
                  const active  = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-[#1a2d4d] text-[#58a6ff]'
                          : 'text-[#8b949e] hover:text-[#cdd9e5] hover:bg-[#161b22]'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: Palace branding + sign out */}
        <div className="border-t border-[#21262d] p-3 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md
                       text-sm text-[#6e7681] hover:text-[#f85149] hover:bg-[#2d0f0e]
                       transition-colors"
          >
            <SignOutIcon size={15} />
            <span>Sign out</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1">
            <img src="/palace.png" alt="The Palace" width={12} height={12} className="opacity-40 rounded-sm" />
            <p className="text-[10px] text-[#30363d]">The Palace, Inc.</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
    </svg>
  )
}
function BuildingIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 1a1 1 0 011-1h10a1 1 0 011 1v14H2V1zm3 2v2h2V3H5zm4 0v2h2V3H9zm-4 4v2h2V7H5zm4 0v2h2V7H9zm-4 4v3h2v-3H5zm4 0v3h2v-3H9z"/>
    </svg>
  )
}
function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 0a.5.5 0 01.5.5V1h8V.5a.5.5 0 011 0V1h1a2 2 0 012 2v11a2 2 0 01-2 2H2a2 2 0 01-2-2V3a2 2 0 012-2h1V.5a.5.5 0 01.5-.5zM1 4v10a1 1 0 001 1h12a1 1 0 001-1V4H1z"/>
    </svg>
  )
}
function LayersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.235 1.559a.5.5 0 00-.47 0l-7.5 4a.5.5 0 000 .882L7.765 10.44a.5.5 0 00.47 0l7.5-4a.5.5 0 000-.882l-7.5-4z"/>
      <path d="M.264 10.008a.5.5 0 01.683-.186L8 13.769l7.053-3.947a.5.5 0 11.47.882l-7.5 4a.5.5 0 01-.47 0l-7.5-4a.5.5 0 01-.186-.682z"/>
    </svg>
  )
}
function BookIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 000 2.5v11a.5.5 0 00.707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 00.78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0016 13.5v-11a.5.5 0 00-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
    </svg>
  )
}
function UsersIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 017 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002H7.022zM11 7a2 2 0 100-4 2 2 0 000 4zm3-2a3 3 0 11-6 0 3 3 0 016 0zM6.936 9.28a5.88 5.88 0 00-1.23-.247A7.35 7.35 0 005 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 015 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 004 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 116 0 3 3 0 01-6 0zm3-2a2 2 0 100 4 2 2 0 000-4z"/>
    </svg>
  )
}
function UserIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm2-3a2 2 0 11-4 0 2 2 0 014 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
    </svg>
  )
}
function CheckSquareIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H2zm10.03 4.97a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
    </svg>
  )
}
function EditIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M15.502 1.94a.5.5 0 010 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 01.707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 00-.121.196l-.805 2.414a.25.25 0 00.316.316l2.414-.805a.5.5 0 00.196-.12l6.813-6.814z"/>
      <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 002.5 15h11a1.5 1.5 0 001.5-1.5v-6a.5.5 0 00-1 0v6a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5H9a.5.5 0 000-1H2.5A1.5 1.5 0 001 2.5v11z"/>
    </svg>
  )
}
function ArrowUpIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 15a.5.5 0 00.5-.5V2.707l3.146 3.147a.5.5 0 00.708-.708l-4-4a.5.5 0 00-.708 0l-4 4a.5.5 0 10.708.708L7.5 2.707V14.5a.5.5 0 00.5.5z"/>
    </svg>
  )
}
function FileTextIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M5 4a.5.5 0 000 1h6a.5.5 0 000-1H5zm-.5 2.5A.5.5 0 015 6h6a.5.5 0 010 1H5a.5.5 0 01-.5-.5zM5 8a.5.5 0 000 1h6a.5.5 0 000-1H5zm0 2a.5.5 0 000 1h3a.5.5 0 000-1H5z"/>
      <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V2zm10-1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1z"/>
    </svg>
  )
}
function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 01-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 01.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 012.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 012.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 01.872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 01-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 01-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 110-5.86 2.929 2.929 0 010 5.858z"/>
    </svg>
  )
}
function SignOutIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M10 12.5a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v2a.5.5 0 001 0v-2A1.5 1.5 0 009.5 2h-8A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h8a1.5 1.5 0 001.5-1.5v-2a.5.5 0 00-1 0v2z"/>
      <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 000-.708l-3-3a.5.5 0 00-.708.708L14.293 7.5H5.5a.5.5 0 000 1h8.793l-2.147 2.146a.5.5 0 00.708.708l3-3z"/>
    </svg>
  )
}
