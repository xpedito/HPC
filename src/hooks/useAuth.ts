import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  | { status: 'inactive' }  // autenticado mas ativo: false

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: 'unauthenticated' })
        return
      }
      // Busca o documento do usuário para verificar ativo e obter perfil
      const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
      if (!snap.exists()) {
        setState({ status: 'inactive' })
        return
      }
      const data = snap.data() as Omit<Usuario, 'id'>
      if (!data.ativo) {
        setState({ status: 'inactive' })
        return
      }
      setState({
        status: 'authenticated',
        user: firebaseUser,
        usuario: { ...data, id: firebaseUser.uid },
      })
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged cuida do estado
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { state, signIn, signOut }
}
