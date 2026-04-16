/**
 * Registration Number Generator
 * Formula: {SCHOOL_CODE}-{YEAR}-{LEVEL}{CLASSNUM}-{4 RANDOM DIGITS}
 * Example: KSB-2025-P1-4821
 */

/**
 * Generate abbreviation from school name
 * Takes first letter of each significant word, uppercased, max 4 chars
 */
export function generateSchoolAbbreviation(schoolName: string): string {
  const stopWords = ['of', 'the', 'and', 'in', 'at', 'de', 'la', 'le']
  const words = schoolName
    .trim()
    .split(/\s+/)
    .filter(w => !stopWords.includes(w.toLowerCase()) && w.length > 0)

  if (words.length === 1) {
    // Single word: take first 3 letters
    return words[0].substring(0, 3).toUpperCase()
  }

  // Multi-word: first letter of each word, max 4
  return words
    .slice(0, 4)
    .map(w => w[0].toUpperCase())
    .join('')
}

/**
 * Generate a registration number
 * @param schoolCode  - e.g. "KSB"
 * @param startYear   - academic year start year e.g. 2025
 * @param levelCode   - 'N' | 'P' | 'O' | 'A'
 * @param classNumber - digit only e.g. 1, 2, 3
 * @param existingNumbers - set of already used numbers for uniqueness check
 */
export function generateRegistrationNumber(
  schoolCode: string,
  startYear: number,
  levelCode: string,
  classNumber: number,
  existingNumbers: Set<string> = new Set()
): string {
  const prefix = `${schoolCode.toUpperCase()}-${startYear}-${levelCode}${classNumber}`

  let attempts = 0
  while (attempts < 100) {
    const random = String(Math.floor(Math.random() * 9000) + 1000) // 1000-9999
    const regNumber = `${prefix}-${random}`
    if (!existingNumbers.has(regNumber)) {
      return regNumber
    }
    attempts++
  }

  // Fallback: use timestamp-based suffix
  const ts = Date.now().toString().slice(-4)
  return `${prefix}-${ts}`
}

/**
 * Parse a registration number back into its components
 */
export function parseRegistrationNumber(regNumber: string) {
  const parts = regNumber.split('-')
  if (parts.length !== 4) return null

  const levelClassPart = parts[2]  // e.g. "P1"
  const levelCode = levelClassPart.charAt(0)
  const classNumber = parseInt(levelClassPart.substring(1))

  return {
    schoolCode: parts[0],
    year: parseInt(parts[1]),
    levelCode,
    classNumber,
    randomDigits: parts[3],
  }
}
