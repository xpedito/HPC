import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// initializeApp é idempotente: seguro chamar várias vezes
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db   = getFirestore(app)

/**
 * Cria usuário no Firebase Auth sem desconectar o administrador logado.
 * Usa uma instância secundária isolada do Firebase App.
 */
export async function criarUsuarioAuthSemDeslogar(email: string, senhaTemp: string): Promise<string> {
  const secondaryAppName = 'SecondaryAuthApp'
  const secondaryApp = getApps().some(a => a.name === secondaryAppName)
    ? getApp(secondaryAppName)
    : initializeApp(firebaseConfig, secondaryAppName)
  
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senhaTemp)
    await signOut(secondaryAuth)
    return cred.user.uid
  } catch (err) {
    await signOut(secondaryAuth)
    throw err
  }
}

// Liga o emulador apenas em dev local com VITE_USE_EMULATOR=true
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Guarda em window para não conectar duas vezes com HMR
  if (!(window as typeof window & { __emulatorsConnected?: boolean }).__emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    ;(window as typeof window & { __emulatorsConnected?: boolean }).__emulatorsConnected = true
  }
}
