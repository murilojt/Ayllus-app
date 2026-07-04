# Nutri App — App do Paciente (Login + Dieta)

Projeto base em **React Native (Expo) + Supabase**, com tela de login e tela de
visualização da dieta do paciente logado.

## O que já está pronto
- Login por e-mail/senha (Supabase Auth)
- Sessão persistida no celular (continua logado ao fechar o app)
- Tela "Minha Dieta" que busca a dieta ativa do paciente e lista as refeições
- Schema SQL com RLS (Row Level Security), garantindo que cada paciente só
  acesse os próprios dados

## Como rodar

### 1. Criar o projeto no Supabase
1. Acesse https://supabase.com e crie um projeto novo (grátis)
2. Vá em **SQL Editor** e rode o conteúdo do arquivo `supabase-schema.sql`
3. Vá em **Settings > API** e copie a `Project URL` e a `anon public key`

### 2. Configurar variáveis de ambiente
Copie `.env.example` para `.env` e preencha com os dados do passo anterior:
```
EXPO_PUBLIC_SUPABASE_URL=https://seuprojeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

### 3. Instalar dependências e rodar
```bash
npm install
npx expo install expo-device expo-linking expo-notifications react-native-web react-dom @expo/metro-runtime
npx expo install --fix
npx expo start
```
O `npx expo install --fix` garante que todas as bibliotecas fiquem na versão
exata esperada pela sua versão do Expo Go — útil sempre que o app reclamar de
incompatibilidade de SDK.
Aí é só escanear o QR code com o app **Expo Go** (iOS/Android) pra testar no
celular, ou apertar `i` / `a` no terminal pra abrir num simulador.

### 4. Criar um paciente de teste
Como ainda não tem tela de cadastro, crie o primeiro usuário direto pelo
Supabase: **Authentication > Users > Add user**. O trigger do SQL já cria o
`profile` automaticamente com `role = patient`.

Depois, insira manualmente uma dieta de teste pra esse paciente na tabela
`diets` e algumas refeições na tabela `meals` (pode fazer isso direto pelo
**Table Editor** do Supabase) — assim você já vê a tela funcionando ponta a
ponta.

## Estrutura do projeto
```
nutri-app/
├── App.tsx                    # Componente raiz
├── app.json                   # Configuração do Expo
├── supabase-schema.sql        # Schema do banco (rodar no Supabase)
├── .env.example
└── src/
    ├── lib/
    │   └── supabase.ts        # Cliente Supabase configurado
    ├── navigation/
    │   └── index.tsx          # Alterna Login <-> Dieta conforme login
    └── screens/
        ├── LoginScreen.tsx
        └── DietScreen.tsx
```

## Próximos passos sugeridos
1. **Tela de cadastro** (sign up) pro paciente, caso a nutricionista não
   cadastre manualmente
2. **Painel web da nutricionista** (ex: Next.js) usando o mesmo banco
   Supabase, com policies de INSERT/UPDATE pra ela cadastrar pacientes e
   montar as dietas
3. **Recuperação de senha** (`supabase.auth.resetPasswordForEmail`)
4. **Notificações push** (lembrete de refeição, mensagem da nutricionista)
5. **Histórico de evolução** (peso, medidas, fotos de progresso)
6. **Chat entre paciente e nutricionista**

## Recuperação de senha

O fluxo completo já está implementado:
1. Na tela de login, o paciente toca em **"Esqueci minha senha"**
2. Digita o e-mail → recebe um link do Supabase
3. Ao abrir o link, o app (ou a versão web) abre direto na tela de nova senha

**Configuração necessária no Supabase:** vá em **Authentication > URL
Configuration** e adicione às **Redirect URLs**:
- `nutriapp://reset-password` (pro app nativo)
- `https://seu-dominio.vercel.app/reset-password` (pra versão web, depois que publicar)

Sem isso, o Supabase recusa o redirecionamento por segurança.

## Notificações push (lembretes de refeição + mensagens da nutricionista)

### O que já funciona
- **Lembretes locais**: ao abrir o app, ele agenda automaticamente uma
  notificação diária pra cada refeição que tem horário definido —
  isso funciona 100% no dispositivo, sem precisar de servidor.
- **Mensagens da nutricionista**: quando ela envia uma mensagem pelo
  painel web, o paciente recebe um push (se tiver permitido notificações)
  e a mensagem também aparece na tela "Minha Dieta", na seção de
  mensagens.

### Passo obrigatório: configurar o projeto EAS
Notificações push remotas (as mensagens da nutricionista, não os lembretes
locais) exigem um projeto vinculado à Expo. Rode uma vez:
```bash
npx eas init
```
Isso adiciona um `projectId` ao seu `app.json` — sem ele, o app consegue
agendar lembretes locais normalmente, mas não consegue registrar o token
de push necessário pra receber mensagens.

### Rodar o patch do banco
Antes de testar, rode o arquivo `supabase-patch-notifications.sql` no SQL
Editor do Supabase (adiciona a coluna de token de push e a tabela de
mensagens).

### Limitações
- Notificações push remotas só funcionam em **dispositivo físico** (não
  funcionam no simulador iOS nem emulador Android)
- Na versão web (PWA), lembretes locais recorrentes não são suportados por
  limitação do navegador — funciona no app nativo (Expo Go ou build)

## Documentos legais (Política de Privacidade e Termos de Uso)

Como o app trata **dados de saúde** (a dieta do paciente é considerada dado
sensível pela LGPD), incluí dois documentos prontos:

- `public/privacy.html` — Política de Privacidade
- `public/terms.html` — Termos de Uso

**Antes de publicar, você precisa preencher os campos marcados** com
`[ENTRE COLCHETES]` dentro desses dois arquivos: seu nome ou razão social,
CPF/CNPJ, e-mail de contato, cidade/comarca, etc.

⚠️ **Importante**: esses documentos são um ponto de partida, não
substituem a revisão por um advogado — principalmente por se tratar de
dados de saúde, que têm exigências mais rígidas na LGPD.

Depois de publicar o app (passo "Versão Web / PWA" abaixo), essas páginas
ficam acessíveis em `https://seu-dominio.com/privacy.html` e
`/terms.html`. Configure a variável `EXPO_PUBLIC_APP_BASE_URL` no seu
`.env` com essa URL — o app já tem links pra essas páginas na tela de
login.

## Versão Web / PWA (sem custo de loja)

O mesmo código também roda como site, instalável na tela inicial do celular
(Android e iOS), sem precisar de conta de desenvolvedor nem aprovação de
loja.

### Rodar localmente
```bash
npx expo start --web
```

### Gerar a versão de produção (arquivos estáticos)
```bash
npx expo export -p web
```
Isso cria uma pasta `dist/` com tudo pronto (HTML, JS, ícones, manifest).

### Publicar de graça
Qualquer hospedagem de site estático serve. As mais simples e gratuitas:

**Vercel** (recomendado, mesmo serviço sugerido pro painel da nutricionista):
```bash
npm install -g vercel
cd dist
vercel --prod
```

**Netlify** (alternativa, também grátis):
1. Acesse https://app.netlify.com/drop
2. Arraste a pasta `dist/` gerada no passo anterior

Em ambos os casos você recebe uma URL pública (ex:
`https://nutri-app.vercel.app`) — é esse link que você compartilha com os
pacientes.

### Como o paciente instala no celular

**Android (Chrome):**
1. Abre o link
2. Toca no menu (⋮) → **Adicionar à tela inicial** (ou o Chrome mostra um
   banner automático sugerindo isso)

**iPhone (Safari — precisa ser Safari, não funciona pelo Chrome no iOS):**
1. Abre o link
2. Toca no ícone de compartilhar (□ com seta pra cima)
3. Toca em **Adicionar à Tela de Início**

Depois de instalado, o app abre em tela cheia, com ícone próprio, sem barra
de navegador — visualmente quase indistinguível de um app nativo baixado
da loja.

### Limitações dessa versão
- Notificações push no iOS via PWA são mais limitadas que num app nativo
- Não tem listagem em loja (Play Store / App Store) — só por link direto
- Pra divulgar, você compartilha o link (QR code funciona bem pra isso)

Quando fizer sentido publicar nas lojas oficiais, o mesmo código funciona —
é só seguir os passos de EAS Build descritos anteriormente.

## Build para as lojas (quando estiver pronto)
Use o **EAS Build** (serviço gratuito/pago da Expo) pra gerar o `.ipa` (iOS)
e `.aab`/`.apk` (Android) sem precisar de Mac:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```
