# HPC Psicologia — Registro de Produção

Sistema de registro de produção do Serviço de Psicologia Hospitalar e Perinatal.

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS
- **Banco:** Cloud Firestore (Firebase)
- **Auth:** Firebase Auth (e-mail/senha)
- **Hospedagem:** Cloudflare Pages (build automático via push na `main`)
- **Testes:** Vitest (funções de cálculo dos indicadores)

---

## Configuração inicial

### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd hpc-psicologia
pnpm install
```

### 2. Configurar Firebase

1. Crie o projeto Firebase em [console.firebase.google.com](https://console.firebase.google.com)
   - Região: `southamerica-east1`
   - Ative **Authentication → E-mail/senha**
   - Ative **Cloud Firestore** (modo produção)

2. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha `.env.local` com as chaves do seu projeto Firebase
   (visíveis em **Configurações do projeto → Seus apps → SDK Config**).

### 3. Implantar regras e índices do Firestore

```bash
# Instale o Firebase CLI se necessário
npm install -g firebase-tools

# Faça login
firebase login

# Selecione o projeto
firebase use <seu-projeto-id>

# Implanta regras e índices
firebase deploy --only firestore
```

### 4. Rodar o seed de domínios

Execute o seed **uma vez** após criar o projeto:

```bash
# Crie um usuário admin no Firebase Auth Console primeiro, depois:
SEED_ADMIN_EMAIL=admin@seudominio SEED_ADMIN_PASSWORD=suasenha pnpm seed:prod
```

> ⚠️ Nunca use dados reais de paciente no seed.

### 5. Criar o primeiro usuário admin

No **Firebase Auth Console**:
1. Vá em Authentication → Users → Add user
2. Crie o e-mail/senha da coordenadora/admin

No **Firestore Console**, crie manualmente o documento:
- Coleção: `usuarios`
- ID do documento: `<uid gerado pelo Firebase Auth>`
- Campos:
  ```
  email: "admin@seudominio"
  nome: "Nome da Coordenadora"
  perfil: "admin"
  ativo: true
  criadoEm: <timestamp atual>
  ```

A partir daí, novos usuários podem ser criados pela tela de Admin (Fase 2).

---

## Desenvolvimento local

### Com emuladores Firebase

```bash
# Instale o emulador
firebase init emulators  # escolha Auth e Firestore

# Inicie os emuladores
firebase emulators:start

# Em outro terminal, rode a app com emulador ligado
VITE_USE_EMULATOR=true pnpm dev
```

### Seed no emulador

```bash
# O emulador cria usuários com qualquer credencial
SEED_ADMIN_EMAIL=admin@demo.local SEED_ADMIN_PASSWORD=demo123456 pnpm seed
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm test` | Testes Vitest (indicadores) |
| `pnpm test:watch` | Testes em modo watch |
| `pnpm seed` | Seed dos domínios no emulador |
| `pnpm seed:prod` | Seed dos domínios em produção (rodar só uma vez) |
| `pnpm lint` | Verificação TypeScript |

---

## Deploy (Cloudflare Pages)

1. No painel do Cloudflare Pages, conecte o repositório GitHub
2. Configure:
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Node.js version:** 20
3. Adicione as variáveis de ambiente (`VITE_FIREBASE_*`) nas Settings do projeto Pages
4. Push na branch `main` dispara deploy automático

---

## Estrutura do projeto

```
src/
├── firebase/config.ts       # Inicialização do Firebase
├── schemas/registro.ts      # Zod schemas e tipos TypeScript
├── logic/indicadores.ts     # Funções puras de cálculo dos indicadores
├── hooks/
│   ├── useAuth.ts           # Estado de autenticação
│   ├── useDominios.ts       # Carregamento das listas
│   └── useRegistros.ts      # CRUD dos registros
├── components/
│   ├── ui.tsx               # Componentes reutilizáveis
│   └── Layout.tsx           # Layout com navegação
└── pages/
    ├── Login.tsx            # Tela de login
    ├── LancarProducao.tsx   # Formulário de lançamento (mobile-first)
    ├── PainelDia.tsx        # Dashboard com indicadores
    └── AdminListas.tsx      # CRUD de domínios (admin)
tests/
└── indicadores.test.ts      # 34 testes das regras de cálculo
scripts/
└── seed.ts                  # Seed dos domínios
firestore.rules              # Regras de segurança
firestore.indexes.json       # Índices compostos
```

---

## Regras de negócio críticas (não podem quebrar)

1. **Visita ≠ Atendimento:** uma ocorrência pode ser visita E atendimento ao mesmo tempo sem dupla contagem
2. **Múltiplos registros/dia:** o sistema não bloqueia nem alerta
3. **Atendimento é explícito:** só conta quando `houveAtendimento = 'Sim'` — nunca inferido

Os testes em `tests/indicadores.test.ts` verificam essas três regras explicitamente.

---

> ⚠️ **Segurança:** nunca commite dados reais de paciente em seeds, testes ou fixtures.
> As chaves públicas do Firebase (`VITE_*`) são seguras de commitar — não incluem chaves de serviço.
