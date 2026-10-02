import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import type { Usuario } from '@/schemas/registro'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; usuario: Usuario }
  | { status: 'inactive'; user: User; motivo: string }

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: 'unauthenticated' })
        return
      }
      try {
        const docRef = doc(db, 'usuarios', firebaseUser.uid)
        const snap = await getDoc(docRef)
        if (!snap.exists()) {
          console.warn('Documento não encontrado no Firestore para o UID:', firebaseUser.uid)
          setState({
            status: 'inactive',
            user: firebaseUser,
            motivo: `Documento "usuarios/${firebaseUser.uid}" não foi encontrado no Firestore. Verifique se o nome da coleção é exatamente "usuarios" e o ID do documento é este UID.`,
          })
          return
        }
        const data = snap.data() as Omit<Usuario, 'id'>
        if (!data.ativo) {
          console.warn('Campo ativo é false ou inexistente:', data)
          setState({
            status: 'inactive',
            user: firebaseUser,
            motivo: `Documento encontrado, mas o campo "ativo" está como falso (${String(data.ativo)}). Ele precisa ser boolean true.`,
          })
          return
        }
        setState({
          status: 'authenticated',
          user: firebaseUser,
          usuario: { ...data, id: firebaseUser.uid },
        })
      } catch (err: unknown) {
        console.error('Erro ao ler documento no Firestore:', err)
        const msg = err instanceof Error ? err.message : String(err)
        setState({
          status: 'inactive',
          user: firebaseUser,
          motivo: `Erro ao consultar Firestore: ${msg}. Pode ser regra de segurança ou banco de dados diferente.`,
        })
      }
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { state, signIn, signInWithGoogle, signOut }
}
