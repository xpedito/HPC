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
  | { status: 'inactive'; user: User }  // autenticado mas sem autorização em usuarios/

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({ status: 'unauthenticated' })
        return
      }
      try {
        // Busca o documento do usuário para verificar ativo e obter perfil
        const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
        if (!snap.exists()) {
          console.warn('Usuário autenticado no Auth, mas sem documento em usuarios/', firebaseUser.uid)
          setState({ status: 'inactive', user: firebaseUser })
          return
        }
        const data = snap.data() as Omit<Usuario, 'id'>
        if (!data.ativo) {
          console.warn('Usuário inativo:', firebaseUser.uid)
          setState({ status: 'inactive', user: firebaseUser })
          return
        }
        setState({
          status: 'authenticated',
          user: firebaseUser,
          usuario: { ...data, id: firebaseUser.uid },
        })
      } catch (err) {
        console.error('Erro ao buscar dados do usuário no Firestore:', err)
        setState({ status: 'inactive', user: firebaseUser })
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
