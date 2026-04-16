import {
  REB_GRADING_SCALE,
  NURSERY_GRADING_SCALE,
  type RebGrade,
  type NurseryGrade,
  type LevelCode,
} from '../types'

/**
 * Get REB grade from percentage (Primary, Ordinary, Advanced)
 */
export function getRebGrade(percentage: number): RebGrade {
  const entry = REB_GRADING_SCALE.find(
    g => percentage >= g.minPercent && percentage <= g.maxPercent
  )
  return entry?.grade ?? 'F'
}

/**
 * Get Nursery grade descriptor from percentage
 */
export function getNurseryGrade(percentage: number): NurseryGrade {
  const entry = NURSERY_GRADING_SCALE.find(g => percentage >= g.minPercent)
  return entry?.grade ?? 'Needs Improvement'
}

/**
 * Get grade for any level
 */
export function getGrade(
  percentage: number,
  levelCode: LevelCode
): RebGrade | NurseryGrade {
  if (levelCode === 'N') return getNurseryGrade(percentage)
  return getRebGrade(percentage)
}

/**
 * Calculate percentage
 */
export function calcPercentage(total: number, max: number): number {
  if (max === 0) return 0
  return Math.round((total / max) * 100 * 100) / 100
}

/**
 * Calculate position of a student in class based on total marks
 * Returns "1 out of 32" format
 */
export function calcPosition(
  studentTotal: number,
  allTotals: number[]
): { position: number; outOf: number } {
  const sorted = [...allTotals].sort((a, b) => b - a)
  const position = sorted.indexOf(studentTotal) + 1
  return { position, outOf: allTotals.length }
}

/**
 * Get conduct score: starts at 40, subtract deductions
 */
export function calcConductScore(deductions: number[]): number {
  const total = deductions.reduce((sum, d) => sum + d, 0)
  return Math.max(0, 40 - total)
}

/**
 * Get grade descriptor for display
 */
export function getGradeDescriptor(grade: RebGrade): string {
  return REB_GRADING_SCALE.find(g => g.grade === grade)?.descriptor ?? ''
}

/**
 * Check if a student passed (grade S or above = pass for REB)
 */
export function isPassing(grade: RebGrade): boolean {
  return ['A', 'B', 'C', 'D', 'E', 'S'].includes(grade)
}
