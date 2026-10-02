import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyC6G4d28K-gqHWuEK-0WwDfpEOBgLaBPVc",
  authDomain:        "psihpc-7.firebaseapp.com",
  projectId:         "psihpc-7",
  storageBucket:     "psihpc-7.firebasestorage.app",
  messagingSenderId: "76069152935",
  appId:             "1:76069152935:web:1eda6ba93a556da5319382",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  const uid = 'OU32RACuqSSohNXM218XqDDz7Fe2'
  const email = 'xpedito+hpc@gmail.com'
  const nome = 'Administrador'

  console.log(`Cadastrando usuário ${email} (${uid}) no Firestore...`)

  await setDoc(doc(db, 'usuarios', uid), {
    nome,
    email,
    perfil: 'admin',
    ativo: true,
    criadoEm: serverTimestamp(),
  })

  console.log('✅ Usuário registrado com sucesso no Firestore!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Erro ao registrar usuário:', err)
  process.exit(1)
})
