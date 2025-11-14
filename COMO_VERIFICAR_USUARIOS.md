# Como Verificar Criação de Usuários

## 📱 1. Testar no App

### Passo a passo:
1. Inicie o app: `npm start`
2. Abra no celular/emulador
3. Na tela de login, clique em **"Não tem conta? Criar agora"**
4. Preencha os campos:
   - Nome completo: `Teste User`
   - E-mail: `teste@exemplo.com`
   - Senha: `123456`
   - Confirmar senha: `123456`
5. Clique em **"Criar Conta"**

### 📋 Logs para acompanhar:
No terminal onde o app está rodando, você verá:

**Se funcionar:**
```
🔵 [AuthContext] Chamando registerService...
🔵 [REGISTER] Iniciando cadastro de usuário: teste@exemplo.com
✅ [REGISTER] Usuário criado com sucesso!
✅ [REGISTER] ID: 123e4567-e89b-12d3-a456-426614174000
✅ [REGISTER] Nome: Teste User
✅ [REGISTER] Email: teste@exemplo.com
✅ [AuthContext] Usuário registrado, salvando localmente...
✅ [AuthContext] Usuário salvo no AsyncStorage e estado atualizado
```

**Se der erro de RLS:**
```
🔴 [REGISTER] ERRO RLS: Execute SUPABASE_RLS_SETUP.sql!
```
→ **Solução:** Execute o arquivo `SUPABASE_RLS_SETUP.sql` no Supabase

**Se email já existir:**
```
🔴 [REGISTER] Email já cadastrado!
```

---

## 🗄️ 2. Verificar no Supabase Dashboard

### Opção A: Table Editor (Mais fácil)
1. Acesse: https://supabase.com/dashboard/project/zdgwinaipuylylwvwuwj/editor
2. No menu lateral, clique em **"Table Editor"** (ícone de tabela)
3. Selecione a tabela **`usuarios`**
4. Você verá uma planilha com todos os usuários:
   - `id` (UUID)
   - `email`
   - `nome`
   - `senha`
   - `avatar`
   - `created_at`

### Opção B: SQL Editor (Mais técnico)
1. Acesse: https://supabase.com/dashboard/project/zdgwinaipuylylwvwuwj/sql
2. Execute esta query:

```sql
-- Ver todos os usuários cadastrados
SELECT 
  id,
  nome,
  email,
  created_at,
  avatar
FROM usuarios
ORDER BY created_at DESC;
```

3. Clique em **"Run"** ou pressione `Ctrl+Enter`
4. Você verá todos os usuários em formato de tabela

### Query úteis:

**Contar total de usuários:**
```sql
SELECT COUNT(*) as total_usuarios FROM usuarios;
```

**Ver último usuário cadastrado:**
```sql
SELECT * FROM usuarios 
ORDER BY created_at DESC 
LIMIT 1;
```

**Buscar usuário por email:**
```sql
SELECT * FROM usuarios 
WHERE email = 'teste@exemplo.com';
```

**Deletar usuário de teste:**
```sql
DELETE FROM usuarios 
WHERE email = 'teste@exemplo.com';
```

---

## 🔍 3. Verificar se RLS está configurado

Execute no SQL Editor:

```sql
-- Verificar políticas RLS ativas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'usuarios';
```

**Resultado esperado:**
Deve mostrar pelo menos 1 política permitindo operações na tabela `usuarios`.

**Se não mostrar nada:**
→ Execute o arquivo `SUPABASE_RLS_SETUP.sql` completo

---

## ⚠️ Problemas Comuns

### 1. "Email já cadastrado"
- O email já existe no banco
- Tente outro email ou delete o existente

### 2. "ERRO RLS"
- Políticas de segurança não configuradas
- **Solução:** Execute `SUPABASE_RLS_SETUP.sql` no Supabase

### 3. App fecha/crasha
- Verifique os logs no terminal
- Certifique-se que o Supabase está configurado corretamente em `supabaseClient.js`

### 4. Não aparece nada no Supabase
- Verifique se o `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
- Veja os logs com 🔴 para identificar o erro

---

## 📊 Dashboard de Monitoramento

Acesse o painel principal:
https://supabase.com/dashboard/project/zdgwinaipuylylwvwuwj

Você pode ver:
- **Database**: Tabelas e dados
- **SQL Editor**: Executar queries
- **API**: Endpoints REST
- **Logs**: Logs de requisições em tempo real
- **Auth**: Sistema de autenticação (não usado no projeto)
