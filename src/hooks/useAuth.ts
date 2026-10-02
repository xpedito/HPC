import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore'
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
        // 1. Tenta buscar direto por UID
        let docRef = doc(db, 'usuarios', firebaseUser.uid)
        let snap = await getDoc(docRef)
        
        // 2. Se não achar por UID, busca por email (caso o admin tenha cadastrado antes de a pessoa logar)
        if (!snap.exists() && firebaseUser.email) {
          const q = query(
            collection(db, 'usuarios'),
            where('email', '==', firebaseUser.email.toLowerCase()),
          )
          const querySnap = await getDocs(q)
          if (!querySnap.empty) {
            const preDoc = querySnap.docs[0]
            const preData = preDoc.data()
            // Se o ID do documento pré-cadastrado não era o UID, migra para o UID
            if (preDoc.id !== firebaseUser.uid) {
              await setDoc(docRef, { ...preData, uid: firebaseUser.uid })
              await deleteDoc(doc(db, 'usuarios', preDoc.id))
            }
            snap = await getDoc(docRef)
          }
        }

        if (!snap.exists()) {
          console.warn('Documento não encontrado no Firestore para:', firebaseUser.email, firebaseUser.uid)
          setState({
            status: 'inactive',
            user: firebaseUser,
            motivo: `O e-mail "${firebaseUser.email}" não está cadastrado na lista de profissionais autorizados. Solicite ao administrador a liberação do seu acesso.`,
          })
          return
        }
        const data = snap.data() as Omit<Usuario, 'id'>
        if (!data.ativo) {
          console.warn('Campo ativo é false:', data)
          setState({
            status: 'inactive',
            user: firebaseUser,
            motivo: `Seu usuário (${firebaseUser.email}) está cadastrado, mas está com status "Inativo". Contate o administrador.`,
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
          motivo: `Erro ao consultar Firestore: ${msg}.`,
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
