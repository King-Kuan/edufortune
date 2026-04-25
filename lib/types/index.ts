// ─── ROLES ────────────────────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'headteacher' | 'teacher'

// ─── SCHOOL ───────────────────────────────────────────────────────────────────
export type SchoolStatus = 'active' | 'inactive' | 'suspended'
export type SchoolHealthStatus = 'below_optimal' | 'optimal' | 'crowded'

export interface School {
  id: string
  name: string
  abbreviation: string
  principalName: string
  email: string
  phone: string
  status: SchoolStatus
  coatOfArmsUrl?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
  // ImageKit file IDs for deletion
  coatOfArmsFileId?: string
  logoFileId?: string
}

export function getSchoolHealth(studentCount: number): SchoolHealthStatus {
  if (studentCount < 300) return 'below_optimal'
  if (studentCount <= 900) return 'optimal'
  return 'crowded'
}

// ─── ACADEMIC YEAR ────────────────────────────────────────────────────────────
export interface AcademicYear {
  id: string
  schoolId: string
  label: string          // e.g. "2025-2026"
  startYear: number      // e.g. 2025
  isActive: boolean
  isLocked: boolean      // true after Annual Reports generated
  currentTerm: 1 | 2 | 3
  createdAt: string
}

// ─── LEVEL ────────────────────────────────────────────────────────────────────
export type LevelCode = 'N' | 'P' | 'O' | 'A'
export type LevelName = 'Nursery' | 'Primary' | 'Ordinary' | 'Advanced'

export interface Level {
  id: string
  schoolId: string
  name: LevelName
  code: LevelCode
  order: number   // 1=Nursery, 2=Primary, 3=Ordinary, 4=Advanced
}

// ─── CLASS ────────────────────────────────────────────────────────────────────
export interface Class {
  id: string
  schoolId: string
  levelId: string
  levelCode: LevelCode
  name: string           // e.g. "P1", "S3", "N2"
  classNumber: number    // digit only e.g. 1, 2, 3
  classTeacherId?: string
  academicYearId: string
  studentCount: number
}

// ─── SUBJECT ──────────────────────────────────────────────────────────────────
export interface Subject {
  id: string
  schoolId: string
  classId: string
  name: string
  maxMT: number      // max marks for mid-term
  maxEX: number      // max marks for exam
  order: number      // display order on report
  isCoreSubject: boolean
}

// ─── TEACHER ──────────────────────────────────────────────────────────────────
export interface Teacher {
  id: string
  schoolId: string
  uid: string             // Firebase Auth UID
  name: string
  email: string
  phone?: string
  role: 'headteacher' | 'teacher'
  assignedClassIds: string[]
  assignedSubjectIds: string[]
  isActive: boolean
  createdAt: string
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────
export interface Student {
  id: string
  schoolId: string
  classId: string
  academicYearId: string
  registrationNumber: string   // e.g. KSB-2025-P1-4821
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: 'M' | 'F'
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  enrolledAt: string
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'excused' | 'late'

export interface AttendanceRecord {
  id: string
  schoolId: string
  classId: string
  studentId: string
  academicYearId: string
  term: 1 | 2 | 3
  date: string            // ISO date YYYY-MM-DD
  status: AttendanceStatus
  note?: string
  recordedBy: string      // teacherId
  recordedAt: string
}

// ─── MARKS ────────────────────────────────────────────────────────────────────
export interface MarkRecord {
  id: string
  schoolId: string
  studentId: string
  subjectId: string
  classId: string
  academicYearId: string
  term: 1 | 2 | 3
  mtMarks: number
  exMarks: number
  totalMarks: number      // computed: mtMarks + exMarks
  maxTotal: number        // maxMT + maxEX
  percentage: number      // computed
  grade: RebGrade | NurseryGrade
  enteredBy: string       // teacherId
  updatedAt: string
}

// ─── CONDUCT / DISCIPLINE ─────────────────────────────────────────────────────
export interface DisciplineRecord {
  id: string
  schoolId: string
  studentId: string
  classId: string
  academicYearId: string
  term: 1 | 2 | 3
  date: string
  description: string
  conductDeduction: number   // points deducted from conduct score (max 40)
  recordedBy: string
  recordedAt: string
}

export interface ConductScore {
  studentId: string
  term: 1 | 2 | 3
  score: number    // out of 40, starts at 40, deductions applied
}

// ─── GRADING ──────────────────────────────────────────────────────────────────
// REB Standard Grading Scale
export type RebGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'S' | 'F'

export interface RebGradeInfo {
  grade: RebGrade
  minPercent: number
  maxPercent: number
  descriptor: string
  value: number
}

export const REB_GRADING_SCALE: RebGradeInfo[] = [
  { grade: 'A', minPercent: 80, maxPercent: 100, descriptor: 'Excellent',     value: 6 },
  { grade: 'B', minPercent: 75, maxPercent: 79,  descriptor: 'Very Good',     value: 5 },
  { grade: 'C', minPercent: 70, maxPercent: 74,  descriptor: 'Good',          value: 4 },
  { grade: 'D', minPercent: 65, maxPercent: 69,  descriptor: 'Satisfactory',  value: 3 },
  { grade: 'E', minPercent: 60, maxPercent: 64,  descriptor: 'Adequate',      value: 2 },
  { grade: 'S', minPercent: 50, maxPercent: 59,  descriptor: 'Minimum Pass',  value: 1 },
  { grade: 'F', minPercent: 0,  maxPercent: 49,  descriptor: 'Fail',          value: 0 },
]

// Nursery uses descriptors only, no numeric grades
export type NurseryGrade = 'Excellent' | 'Very Good' | 'Good' | 'Satisfactory' | 'Needs Improvement'

export const NURSERY_GRADING_SCALE = [
  { grade: 'Excellent' as NurseryGrade,          minPercent: 80 },
  { grade: 'Very Good' as NurseryGrade,           minPercent: 70 },
  { grade: 'Good' as NurseryGrade,                minPercent: 60 },
  { grade: 'Satisfactory' as NurseryGrade,        minPercent: 50 },
  { grade: 'Needs Improvement' as NurseryGrade,   minPercent: 0  },
]

// ─── PROMOTION ────────────────────────────────────────────────────────────────
export type PromotionDecision = 'Promoted' | '2nd Sitting' | 'Advised to Repeat' | 'Discontinued'

export interface PromotionRecord {
  id: string
  schoolId: string
  studentId: string
  academicYearId: string
  fromClassId: string
  toClassId?: string
  firstDecision: PromotionDecision
  finalDecision: PromotionDecision
  decidedBy: string         // headteacherId
  decidedAt: string
  isManual: boolean
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export type ReportType = 'progressive' | 'annual'

export interface ReportMetadata {
  id: string
  schoolId: string
  studentId: string
  classId: string
  academicYearId: string
  type: ReportType
  term?: 1 | 2 | 3            // only for progressive
  verificationToken: string   // used for QR code URL
  generatedBy: string
  generatedAt: string
}

// ─── SUPER ADMIN SUMMARY ──────────────────────────────────────────────────────
export interface SchoolSummary {
  schoolId: string
  schoolName: string
  abbreviation: string
  totalStudents: number
  healthStatus: SchoolHealthStatus
  activeTeachers: number
  currentAcademicYear?: string
  lastActivity?: string
}
