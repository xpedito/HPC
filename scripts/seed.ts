/**
 * Seed dos domínios e itens do HPC Psicologia.
 *
 * Uso local (emulador):  pnpm seed
 * Uso produção (1x só):  pnpm seed:prod
 *
 * Nunca coloque dados reais de paciente aqui.
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
} from 'firebase/auth'

// ─── Configuração do Firebase ─────────────────────────────────────────────────
// Em CI/seed local, usa variáveis de ambiente ou valores de emulador.
const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY            ?? 'demo-key',
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'demo-project.firebaseapp.com',
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID         ?? 'demo-project',
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.VITE_FIREBASE_APP_ID             ?? 'demo-app-id',
}

const isProd = process.env.SEED_TARGET === 'prod'

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

if (!isProd) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  console.log('🔧 Conectado ao emulador do Firebase')
}

// ─── Definição dos domínios ───────────────────────────────────────────────────

type DomainSeed = { nome: string; itens: string[] }

const DOMINIOS: Record<string, DomainSeed> = {
  turno: {
    nome: 'Turno',
    itens: [
      'Manhã',
      'Tarde',
      'Noite',
      'Sobreaviso/dia',
      'Sobreaviso/noite',
    ],
  },
  eixo: {
    nome: 'Eixo',
    itens: [
      'Assistência ao paciente/família',
      'Atenção à saúde do colaborador',
      'Formação continuada / educação permanente',
      'Ação coletiva / campanha',
      'Atuação institucional',
    ],
  },
  setor: {
    nome: 'Setor',
    itens: [
      'Observação',
      'Pré-parto',
      'Parto normal',
      'Neonatologia - Enfermaria 02',
      'Clínica médica obstetrícia - Enfermaria 03 (grávidas)',
      'Clínica médica obstetrícia - Enfermaria 04 (cesarianas)',
      'Reservado - Clínica médica obstétrica',
      'Clínica médica - Enfermaria 05 (retaguarda)',
      'Enfermaria clínica feminina',
      'Enfermaria clínica masculina',
      'Centro Cirúrgico',
      'Sala de parto',
      'Apartamentos',
      'Sala da Psicologia',
      'Consultórios',
      'Outro setor',
    ],
  },
  publico: {
    nome: 'Público',
    itens: [
      'Paciente',
      'Acompanhante',
      'Familiar',
      'Paciente + acompanhante/familiar',
      'Mãe de RN/NEO',
      'Pai/familiar de RN',
      'Colaborador',
      'Equipe',
      'Grupo de pacientes/familiares',
      'Grupo de colaboradores',
      'Grupo misto',
    ],
  },
  origemContato: {
    nome: 'Origem do contato',
    itens: [
      'Visita psicológica diária / visita de rotina',
      'Atendimento psicológico individual',
      'Atendimento à beira leito',
      'Acolhimento psicológico',
      'Avaliação psicológica',
      'Suporte psicológico no parto',
      'Acompanhamento de acompanhante/familiar',
      'Atendimento em grupo',
      'Interconsulta',
      'Psicoeducação',
      'Ação educativa/campanha',
      'Articulação com rede',
      'Ação institucional',
      'Formação continuada',
      'Ação clínica',
    ],
  },
  localIntervencao: {
    nome: 'Local da intervenção',
    itens: [
      'Enfermaria/leito',
      'Apartamento',
      'Sala de atendimento',
      'Sala de espera',
      'Centro Obstétrico',
      'Neonatologia',
      'Reservado – Neonatologia',
      'Pré-parto',
      'Observação',
      'Consultório Médico',
      'Sala Psicossocial',
      'Centro Cirúrgico',
      'Sala de parto',
      'Jardim / espaço externo da unidade',
      'Consultórios',
      'Outro',
    ],
  },
  procedimento: {
    nome: 'Procedimento',
    itens: [
      'Atendimento psicológico individual',
      'Acolhimento e escuta psicológica',
      'Escuta psicológica',
      'Avaliação psicológica',
      'Suporte emocional',
      'Intervenção em crise',
      'Psicoeducação em saúde mental',
      'Psicoeducação sobre cuidados no ambiente hospitalar',
      'Orientação ao paciente',
      'Orientação ao acompanhante/familiar',
      'Orientação ao colaborador',
      'Acompanhamento durante visita ao RN',
      'Suporte psicológico no parto',
      'Acolhimento pré-cirúrgico',
      'Acolhimento pós-cirúrgico',
      'Acolhimento de acompanhante/familiar',
      'Interconsulta/discussão de caso',
      'Encaminhamento para rede',
      'Articulação com equipe',
      'Ação em grupo',
      'Formação continuada',
      'Educação permanente',
      'Ação educativa/institucional',
      'Seguimento psicológico',
      'Atividade externa à unidade',
      'Sem intervenção psicológica',
      'Outro',
    ],
  },
  demanda: {
    nome: 'Demanda',
    itens: [
      'Acompanhamento psicológico de rotina',
      'Adaptação à hospitalização',
      'Ansiedade/medo',
      'Sofrimento emocional',
      'Luto/perda',
      'Dificuldade de enfrentamento',
      'Vínculo mãe-bebê/família-bebê',
      'Impacto da gravidade clínica',
      'Comunicação/compreensão do quadro',
      'Conflito familiar',
      'Demanda espontânea',
      'Demanda identificada em visita de rotina',
      'Demanda da equipe',
      'Demanda relacionada ao trabalho',
      'Saúde mental do colaborador',
      'Continuidade do cuidado',
      'Psicoeducação / promoção de saúde mental',
      'Outro',
    ],
  },
  situacaoEspecifica: {
    nome: 'Situação específica',
    itens: [
      'Aborto/perda gestacional',
      'Gravidez ectópica',
      'Óbito embrionário/fetal',
      'Óbito',
      'Parto vaginal',
      'Puerpério',
      'RN internado na NEO',
      'Pré-cirúrgico',
      'Pós-cirúrgico',
      'Cesárea/pós-cesárea',
      'Intercorrência clínica na gestação',
      'Intercorrência no parto',
      'Situação relacionada ao trabalho',
      'Nenhuma específica',
      'Outro',
    ],
  },
  frequencia: {
    nome: 'Frequência',
    itens: [
      'Primeiro contato',
      'Seguimento - 2º ou mais contato',
      'Visita diária / acompanhamento continuado',
      'Contato pontual',
    ],
  },
  encaminhamento: {
    nome: 'Encaminhamento',
    itens: [
      'Não se aplica',
      'Nenhum',
      'Equipe multiprofissional',
      'Serviço Social',
      'Enfermagem',
      'Médico/equipe médica',
      'UBS/Atenção Básica',
      'CAPS/saúde mental',
      'Outro serviço da rede',
      'Família/rede de apoio',
      'AME',
      'Administração/Coordenação',
      'Outro',
    ],
  },
  modalidade: {
    nome: 'Modalidade',
    itens: [
      'Individual',
      'Conjunto',
      'Grupo',
      'À beira-leito',
      'Não se aplica',
      'Não informado',
    ],
  },
}

// ─── Função de seed ───────────────────────────────────────────────────────────

async function seedDominio(chave: string, seed: DomainSeed): Promise<void> {
  const dominioRef = doc(db, 'dominios', chave)

  // Não sobrescreve o documento pai se já existir (evita apagar customizações)
  const snap = await getDoc(dominioRef)
  if (!snap.exists()) {
    await setDoc(dominioRef, { chave, nome: seed.nome })
    console.log(`  ✓ Domínio criado: ${chave}`)
  } else {
    console.log(`  · Domínio já existe: ${chave}`)
  }

  // Itens: usa o valor (slug) como id para ser idempotente
  const itensCol = collection(db, 'dominios', chave, 'itens')
  for (let i = 0; i < seed.itens.length; i++) {
    const valor = seed.itens[i]
    // id = índice zero-padded para manter a ordem e ser estável
    const itemId = String(i).padStart(3, '0')
    const itemRef = doc(itensCol, itemId)
    const itemSnap = await getDoc(itemRef)

    if (!itemSnap.exists()) {
      await setDoc(itemRef, { valor, ordem: i, ativo: true })
      console.log(`    + Item: ${valor}`)
    }
    // Se já existe, não atualiza — preserva edições feitas pelo admin
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@demo.local'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'demo123456'

  console.log(`\n🌱 Iniciando seed dos domínios (${isProd ? 'PRODUÇÃO' : 'emulador'})`)
  console.log(`   Autenticando como: ${adminEmail}\n`)

  await signInWithEmailAndPassword(auth, adminEmail, adminPassword)

  for (const [chave, seed] of Object.entries(DOMINIOS)) {
    await seedDominio(chave, seed)
  }

  console.log('\n✅ Seed concluído!\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed falhou:', err)
  process.exit(1)
})
