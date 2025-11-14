# 📱 EventFlow

> Aplicativo mobile para descoberta e gerenciamento de eventos locais com React Native e Expo

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📖 Sobre o Projeto

**EventFlow** é um aplicativo mobile desenvolvido em React Native/Expo que permite aos usuários descobrir, favoritar e gerenciar eventos locais de forma intuitiva. O app oferece visualização em lista e mapa, sistema de favoritos, filtros avançados e integração com apps de navegação.

**🆕 Versão 2.0:** Agora com backend Supabase para sincronização em nuvem e persistência de dados em produção!

### ✨ Principais Funcionalidades

- 🏠 **Feed de Eventos**: Visualização em cards com imagens, categorias, datas e preços
- ⭐ **Sistema de Favoritos**: Salve seus eventos preferidos com sincronização na nuvem
- 🗺️ **Visualização em Mapa**: Explore eventos por localização geográfica
- 🔍 **Filtros Avançados**: 
  - Filtro por data (Hoje, Esta Semana, Este Mês)
  - Filtro por preço (Gratuito ou valor máximo)
  - Filtro por categorias personalizadas
- 🧭 **Integração com Navegação**: Botão "Como Chegar" com Google Maps e Waze
- 📝 **Gerenciamento Completo**: Criar, editar e excluir eventos, locais e categorias
- 👤 **Cadastro de Usuários**: Crie sua conta e faça login
- ☁️ **Sincronização em Nuvem**: Dados salvos no Supabase PostgreSQL
- 🎨 **UI/UX Moderna**: Interface intuitiva com design limpo e responsivo


## 🚀 Tecnologias Utilizadas

### Core
- **React Native** 0.81.5 - Framework para desenvolvimento mobile
- **Expo SDK** 54 - Plataforma para desenvolvimento e build
- **React Navigation** 7.x - Navegação entre telas
- **JavaScript** - Linguagem de programação

### Backend & Database
- **Supabase** - Backend as a Service (PostgreSQL na nuvem)
- `@supabase/supabase-js` - Cliente JavaScript para Supabase
- **PostgreSQL** - Banco de dados relacional

### Bibliotecas Principais
- `react-native-maps` - Visualização de mapas e marcadores
- `expo-location` - Geolocalização e permissões
- `expo-image-picker` - Seleção de imagens da galeria/câmera
- `@react-native-async-storage/async-storage` - Persistência local (cache de autenticação)
- `@expo/vector-icons` - Ícones (Ionicons)

### Arquitetura
- **Context API** - Gerenciamento de estado global (autenticação)
- **Supabase REST API** - Operações CRUD com PostgreSQL
- **Row Level Security (RLS)** - Políticas de segurança no banco de dados
- **Hooks** - useState, useEffect, useIsFocused para lógica de componentes

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- **Node.js** (versão 18.x ou superior) - [Download](https://nodejs.org/)
- **npm** ou **yarn** - Gerenciador de pacotes (vem com Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Expo Go** (no celular) - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779)

### Verificar Instalações

```bash
node --version   # Deve retornar v18.x.x ou superior
npm --version    # Deve retornar 9.x.x ou superior
git --version    # Deve retornar 2.x.x ou superior
```

## 🔧 Instalação e Configuração

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/randerson2206/App-EventFlow.git
cd App-EventFlow
```

### 2️⃣ Instalar Dependências

```bash
npm install
```

**Ou com yarn:**
```bash
yarn install
```

### 3️⃣ Configurar Supabase

O app já vem configurado com credenciais do Supabase. Se você quiser usar seu próprio projeto:

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o SQL de setup: `SUPABASE_RLS_SETUP.sql`
4. Copie a URL e a Anon Key do projeto
5. Atualize em `src/services/supabaseClient.js`:

```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
```

### 4️⃣ Iniciar o Servidor Expo

```bash
npx expo start
```

**Ou:**
```bash
npm start
```

### 5️⃣ Executar no Dispositivo

Após iniciar o servidor, você verá um QR Code no terminal.

#### 📱 No Celular (Recomendado):
1. Abra o app **Expo Go** no seu smartphone
2. **Android**: Escaneie o QR Code com o app Expo Go
3. **iOS**: Escaneie o QR Code com a câmera nativa do iPhone

#### 💻 No Emulador:
- **Android**: Pressione `a` no terminal (requer Android Studio e emulador configurado)
- **iOS**: Pressione `i` no terminal (requer macOS e Xcode)
- **Web**: Pressione `w` no terminal

## 📦 Build de Produção (APK/AAB)

### Gerar APK para Android

1. **Instalar EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Fazer login no Expo:**
```bash
eas login
```

3. **Configurar o projeto (primeira vez):**
```bash
eas build:configure
```

4. **Gerar APK:**
```bash
eas build -p android --profile preview
```

5. **Gerar AAB para Google Play:**
```bash
eas build -p android --profile production
```

6. **Aguardar o build** (5-10 minutos)
7. **Baixar o APK/AAB** pelo link fornecido ou QR Code
8. **Instalar no Android:** Habilite "Fontes desconhecidas" e instale o APK

### Configurações de Build (eas.json)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"  // APK instalável
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"  // AAB para Google Play
      }
    }
  }
}
```

## 📂 Estrutura do Projeto

```
EventFlow/
├── assets/              # Imagens, ícones e recursos estáticos
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   └── ErrorBoundary.js
│   ├── context/         # Context API (estado global)
│   │   └── AuthContext.js
│   ├── navigation/      # Configuração de navegação
│   │   └── AppNavigator.js
│   ├── screens/         # Telas do aplicativo
│   │   ├── HomeScreen.js           # Feed principal
│   │   ├── FavoritosScreen.js      # Lista de favoritos
│   │   ├── EventoDetailScreen.js   # Detalhes do evento
│   │   ├── EventoFormScreen.js     # Criar/Editar evento
│   │   ├── MapaScreen.js           # Visualização em mapa
│   │   ├── CategoriasScreen.js     # Gerenciar categorias
│   │   ├── LocaisScreen.js         # Gerenciar locais
│   │   ├── PerfilScreen.js         # Perfil do usuário
│   │   └── ...
│   ├── services/        # Lógica de negócio e integração com Supabase
│   │   ├── supabaseClient.js       # Configuração do cliente Supabase
│   │   ├── eventosService.js       # CRUD de eventos (Supabase)
│   │   ├── favoritosService.js     # Sistema de favoritos (Supabase)
│   │   ├── categoriasService.js    # CRUD de categorias (Supabase)
│   │   ├── locaisService.js        # CRUD de locais (Supabase)
│   │   └── authService.js          # Autenticação (Supabase)
│   └── theme/           # Tema e estilos globais
│       └── theme.js
├── App.js               # Componente raiz
├── app.json             # Configurações do Expo
├── eas.json             # Configurações do EAS Build (APK/AAB)
├── package.json         # Dependências do projeto
├── SUPABASE_RLS_SETUP.sql        # Script SQL para configurar banco
├── COMO_VERIFICAR_USUARIOS.md    # Guia de verificação de usuários
└── README.md            # Este arquivo
```

## 🎯 Como Usar

### Criar Conta / Login
1. Na tela inicial, você pode:
   - **Fazer login** com email e senha
   - **Criar conta** clicando em "Não tem conta? Criar agora"
2. Preencha os dados e clique em "Criar Conta" ou "Entrar"
3. Usuário de teste já cadastrado:
   - **Email**: `randersonteste@gmail.com`
   - **Senha**: `12345`

### Funcionalidades Principais

#### 📌 Favoritar Eventos
1. Na tela inicial, toque no ícone de **coração** no card do evento
2. Acesse seus favoritos pelo menu hamburger → **Meus Favoritos**
3. Remova favoritos tocando no coração novamente

#### 🔍 Filtrar Eventos
1. Toque no ícone de **filtro** no canto superior direito
2. Selecione filtros de data, preço e/ou categorias
3. Toque em **Aplicar** para ver os resultados
4. Use **Limpar Filtros** para resetar

#### 🧭 Como Chegar
1. Abra os detalhes de um evento
2. Toque no botão verde **Como Chegar**
3. Escolha entre **Google Maps** ou **Waze**
4. O app de navegação será aberto com as coordenadas

#### ➕ Criar Novo Evento
1. Menu hamburger → **Criar Evento**
2. Preencha os dados (nome, categoria, local, data, preço, descrição)
3. Adicione imagens da galeria ou câmera
4. Toque em **Salvar**

#### 🗺️ Explorar no Mapa
1. Navegue para a aba **Mapa** na barra inferior
2. Visualize todos os eventos com marcadores
3. Toque em um marcador para ver detalhes
4. Use o botão **Explore pelo Mapa** para navegar para a tela completa

## 🛠️ Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm start

# Limpar cache e reiniciar
npx expo start -c

# Rodar no Android (emulador)
npm run android

# Rodar no iOS (emulador)
npm run ios

# Rodar no Web
npm run web

# Build APK para Android (EAS Build)
eas build -p android --profile preview

# Build AAB para Google Play (EAS Build)
eas build -p android --profile production
```

## 🐛 Resolução de Problemas

### Erro de RLS no Supabase
Se você vir logs como `🔴 ERRO RLS`:
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Execute o arquivo `SUPABASE_RLS_SETUP.sql` completo
4. Reinicie o app

### Eventos não aparecem
1. Verifique se as políticas RLS estão configuradas (erro acima)
2. Confirme que existem eventos no banco de dados
3. Verifique os logs no terminal para ver mensagens de erro

### Porta em uso
Se a porta 8081 estiver ocupada, o Expo automaticamente oferecerá usar a porta 8082.

### Erro ao instalar dependências
```bash
# Limpar cache do npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### App não carrega no Expo Go
1. Certifique-se de que o celular está na mesma rede Wi-Fi que o computador
2. Desative VPNs ou firewalls que possam bloquear a conexão
3. Tente limpar o cache: `npx expo start -c`

### Erro no MapView
```bash
# Reinstalar dependência de mapas
npm install react-native-maps
```

### Build APK falha
1. Instale EAS CLI globalmente: `npm install -g eas-cli`
2. Faça login: `eas login`
3. Configure o projeto: `eas build:configure`
4. Tente novamente: `eas build -p android --profile preview`

## 📝 Banco de Dados

### Estrutura das Tabelas (Supabase PostgreSQL)

```sql
-- Usuários
usuarios (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  nome TEXT,
  senha TEXT,
  avatar TEXT,
  created_at TIMESTAMP
)

-- Categorias
categorias (
  id UUID PRIMARY KEY,
  nome TEXT,
  created_at TIMESTAMP
)

-- Locais
locais (
  id UUID PRIMARY KEY,
  nome TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  endereco TEXT,
  created_at TIMESTAMP
)

-- Eventos
eventos (
  id UUID PRIMARY KEY,
  nome TEXT,
  descricao TEXT,
  data DATE,
  hora TIME,
  hora_fim TIME,
  preco DECIMAL,
  categoria_id UUID → categorias(id),
  local_id UUID → locais(id),
  imagens TEXT[],
  created_at TIMESTAMP
)

-- Favoritos
favoritos (
  id UUID PRIMARY KEY,
  usuario_id UUID → usuarios(id),
  evento_id UUID → eventos(id),
  created_at TIMESTAMP,
  UNIQUE(usuario_id, evento_id)
)
```

### Verificar Dados

Veja o guia completo em: [`COMO_VERIFICAR_USUARIOS.md`](./COMO_VERIFICAR_USUARIOS.md)

**Dashboard Supabase:**
- Table Editor: https://supabase.com/dashboard/project/zdgwinaipuylylwvwuwj/editor
- SQL Editor: https://supabase.com/dashboard/project/zdgwinaipuylylwvwuwj/sql

## 🔐 Autenticação

O app usa Supabase para autenticação e gerenciamento de usuários:

**Usuário de teste:**
```javascript
Email: randersonteste@gmail.com
Senha: 12345
```

**Criar nova conta:**
1. Clique em "Não tem conta? Criar agora" na tela de login
2. Preencha nome, email, senha e confirmação
3. Sua conta será criada no Supabase automaticamente

**Recursos de segurança:**
- Senhas armazenadas em texto plano (⚠️ **não use em produção**)
- Row Level Security (RLS) configurado no Supabase
- Validação de email único
- AsyncStorage para cache de sessão local

**⚠️ Nota de Segurança:**
Este é um projeto de demonstração. Para produção, implemente:
- Hash de senhas (bcrypt, argon2)
- Tokens JWT para autenticação
- Refresh tokens
- Validação de email
- Autenticação de dois fatores (2FA)

## 🚧 Melhorias Futuras

- [ ] Hash de senhas com bcrypt/argon2
- [ ] Autenticação JWT com refresh tokens
- [ ] Sistema de notificações push
- [ ] Compartilhamento de eventos em redes sociais
- [ ] Sistema de comentários e avaliações
- [ ] Integração com calendário do dispositivo
- [ ] Upload de imagens para Supabase Storage
- [ ] Modo offline completo com sincronização
- [ ] Suporte a múltiplos idiomas (i18n)
- [ ] Dark mode
- [ ] Sistema de check-in em eventos
- [ ] Filtros geográficos (eventos perto de mim)
- [ ] Paginação de eventos para melhor performance

## 👨‍💻 Autor

**Randerson**

- GitHub: [@randerson2206](https://github.com/randerson2206)
- Repositório: [App-EventFlow](https://github.com/randerson2206/App-EventFlow)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request



Se você tiver alguma dúvida ou problema, abra uma [issue](https://github.com/randerson2206/App-EventFlow/issues) no GitHub.

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!

**Desenvolvido com ❤️ usando React Native e Expo**
