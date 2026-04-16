import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { UserRole } from '../types'

export interface AuthUser {
  uid: string
  email: string
  role: UserRole
  schoolId?: string    // undefined for superadmin
  name: string
  isFirstLogin: boolean
}

/**
 * Sign in and return the user's role and school
 */
export async function signIn(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(credential.user.uid)
  if (!profile) throw new Error('User profile not found. Contact your administrator.')
  return profile
}

/**
 * Fetch user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<AuthUser | null> {
  const snap = await getDoc(doc(db, 'userProfiles', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    email:        data.email,
    role:         data.role as UserRole,
    schoolId:     data.schoolId,
    name:         data.name,
    isFirstLogin: data.isFirstLogin ?? false,
  }
}

/**
 * Complete first-time login: change password and mark profile
 */
export async function completeFirstLogin(
  user: User,
  newPassword: string
): Promise<void> {
  await updatePassword(user, newPassword)
  await setDoc(
    doc(db, 'userProfiles', user.uid),
    { isFirstLogin: false, passwordChangedAt: serverTimestamp() },
    { merge: true }
  )
}

/**
 * Create a user profile document (called server-side after account creation)
 */
export async function createUserProfile(
  uid: string,
  data: Omit<AuthUser, 'uid'>
): Promise<void> {
  await setDoc(doc(db, 'userProfiles', uid), {
    ...data,
    isFirstLogin: true,
    createdAt: serverTimestamp(),
  })
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export { onAuthStateChanged, auth }
