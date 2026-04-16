import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy,
  serverTimestamp, writeBatch, type QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type {
  School, AcademicYear, Level, Class, Subject,
  Teacher, Student, MarkRecord, AttendanceRecord,
  DisciplineRecord, PromotionRecord, ReportMetadata, SchoolSummary,
} from '../types'
import { getSchoolHealth } from '../types'

// ─── SCHOOLS ──────────────────────────────────────────────────────────────────

export async function getSchool(schoolId: string): Promise<School | null> {
  const snap = await getDoc(doc(db, 'schools', schoolId))
  return snap.exists() ? { id: snap.id, ...snap.data() } as School : null
}

export async function getAllSchools(): Promise<School[]> {
  const snap = await getDocs(collection(db, 'schools'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as School)
}

export async function createSchool(data: Omit<School, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'schools'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSchool(
  schoolId: string,
  data: Partial<School>
): Promise<void> {
  await updateDoc(doc(db, 'schools', schoolId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ─── SCHOOL SUMMARIES (Super Admin) ───────────────────────────────────────────

export async function getSchoolSummaries(): Promise<SchoolSummary[]> {
  const schools = await getAllSchools()
  const summaries: SchoolSummary[] = []

  for (const school of schools) {
    const studentsSnap = await getDocs(
      query(collection(db, 'schools', school.id, 'students'))
    )
    const teachersSnap = await getDocs(
      query(
        collection(db, 'schools', school.id, 'teachers'),
        where('isActive', '==', true)
      )
    )
    const activeYear = await getActiveAcademicYear(school.id)
    const totalStudents = studentsSnap.size

    summaries.push({
      schoolId:           school.id,
      schoolName:         school.name,
      abbreviation:       school.abbreviation,
      totalStudents,
      healthStatus:       getSchoolHealth(totalStudents),
      activeTeachers:     teachersSnap.size,
      currentAcademicYear: activeYear?.label,
    })
  }

  return summaries
}

// ─── ACADEMIC YEARS ───────────────────────────────────────────────────────────

export async function getActiveAcademicYear(
  schoolId: string
): Promise<AcademicYear | null> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'academicYears'),
      where('isActive', '==', true)
    )
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as AcademicYear
}

export async function createAcademicYear(
  schoolId: string,
  data: Omit<AcademicYear, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'schools', schoolId, 'academicYears'),
    data
  )
  return ref.id
}

export async function lockAcademicYear(
  schoolId: string,
  yearId: string
): Promise<void> {
  await updateDoc(
    doc(db, 'schools', schoolId, 'academicYears', yearId),
    { isLocked: true, isActive: false }
  )
}

// ─── CLASSES ──────────────────────────────────────────────────────────────────

export async function getClasses(
  schoolId: string,
  academicYearId: string
): Promise<Class[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'classes'),
      where('academicYearId', '==', academicYearId),
      orderBy('levelCode'),
      orderBy('classNumber')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Class)
}

export async function createClass(
  schoolId: string,
  data: Omit<Class, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'schools', schoolId, 'classes'), data)
  return ref.id
}

// ─── SUBJECTS ─────────────────────────────────────────────────────────────────

export async function getSubjects(
  schoolId: string,
  classId: string
): Promise<Subject[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'subjects'),
      where('classId', '==', classId),
      orderBy('order')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Subject)
}

// ─── TEACHERS ─────────────────────────────────────────────────────────────────

export async function getTeachers(schoolId: string): Promise<Teacher[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'teachers'),
      where('isActive', '==', true)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Teacher)
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

export async function getStudents(
  schoolId: string,
  classId: string
): Promise<Student[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'students'),
      where('classId', '==', classId),
      orderBy('lastName')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Student)
}

export async function createStudent(
  schoolId: string,
  data: Omit<Student, 'id'>
): Promise<string> {
  const ref = await addDoc(
    collection(db, 'schools', schoolId, 'students'),
    { ...data, enrolledAt: serverTimestamp() }
  )
  return ref.id
}

// ─── MARKS ────────────────────────────────────────────────────────────────────

export async function getMarksForClass(
  schoolId: string,
  classId: string,
  term: 1 | 2 | 3,
  academicYearId: string
): Promise<MarkRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'marks'),
      where('classId', '==', classId),
      where('term', '==', term),
      where('academicYearId', '==', academicYearId)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MarkRecord)
}

export async function upsertMark(
  schoolId: string,
  markId: string | null,
  data: Omit<MarkRecord, 'id'>
): Promise<string> {
  if (markId) {
    await setDoc(doc(db, 'schools', schoolId, 'marks', markId), data, { merge: true })
    return markId
  }
  const ref = await addDoc(collection(db, 'schools', schoolId, 'marks'), data)
  return ref.id
}

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export async function getAttendanceForDate(
  schoolId: string,
  classId: string,
  date: string
): Promise<AttendanceRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AttendanceRecord)
}

export async function batchSaveAttendance(
  schoolId: string,
  records: Omit<AttendanceRecord, 'id'>[]
): Promise<void> {
  const batch = writeBatch(db)
  for (const record of records) {
    const ref = doc(collection(db, 'schools', schoolId, 'attendance'))
    batch.set(ref, record)
  }
  await batch.commit()
}

// ─── DISCIPLINE ───────────────────────────────────────────────────────────────

export async function getDisciplineRecords(
  schoolId: string,
  studentId: string,
  term: 1 | 2 | 3
): Promise<DisciplineRecord[]> {
  const snap = await getDocs(
    query(
      collection(db, 'schools', schoolId, 'discipline'),
      where('studentId', '==', studentId),
      where('term', '==', term),
      orderBy('date', 'desc')
    )
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as DisciplineRecord)
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export async function saveReportMetadata(
  schoolId: string,
  data: Omit<ReportMetadata, 'id'>
): Promise<string> {
  // Save in school subcollection
  const ref = await addDoc(
    collection(db, 'schools', schoolId, 'reports'),
    data
  )
  // Also save verification token in root collection for public QR lookup
  await setDoc(doc(db, 'verificationTokens', data.verificationToken), {
    reportId: ref.id,
    schoolId,
    studentId: data.studentId,
    type:      data.type,
    term:      data.term,
    generatedAt: data.generatedAt,
  })
  return ref.id
}

export async function getReportByToken(token: string): Promise<{
  reportId: string
  schoolId: string
  studentId: string
} | null> {
  const snap = await getDoc(doc(db, 'verificationTokens', token))
  if (!snap.exists()) return null
  return snap.data() as { reportId: string; schoolId: string; studentId: string }
}
