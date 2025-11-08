# 🔧 Configuração do Sistema de Administração

## ✅ Correções Aplicadas

### **Problema Identificado**
O erro `❌ Erro ao verificar autenticação admin` ocorria porque:
1. ❌ Usava `supabase` em vez de `supabaseClient`
2. ❌ Não tratava erros de tabela inexistente
3. ❌ Bloqueava acesso durante desenvolvimento

### **Soluções Implementadas**
1. ✅ Corrigido uso de `supabaseClient` consistentemente
2. ✅ Tratamento de erro quando tabela não existe
3. ✅ Modo de desenvolvimento que permite acesso temporário
4. ✅ Logs detalhados para debug

---

## 🗄️ Como Criar a Tabela de Admins no Supabase

### **Opção 1: Usando o SQL Editor do Supabase**

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Cole e execute este script:

```sql
-- Criar tabela de admins
CREATE TABLE IF NOT EXISTS public.admins (
    id_admin UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índice para email (otimização de busca)
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura (necessária para login)
CREATE POLICY "Permitir leitura de admins" ON public.admins
    FOR SELECT
    USING (true);

-- Comentários
COMMENT ON TABLE public.admins IS 'Tabela de administradores do sistema';
COMMENT ON COLUMN public.admins.id_admin IS 'ID único do administrador';
COMMENT ON COLUMN public.admins.nome IS 'Nome completo do administrador';
COMMENT ON COLUMN public.admins.email IS 'Email do administrador (usado para login)';
COMMENT ON COLUMN public.admins.senha IS 'Hash SHA-256 da senha';
```

### **Opção 2: Usando o arquivo SQL fornecido**

Se você tem o arquivo `supabase-setup.sql`, execute-o no SQL Editor.

---

## 👤 Como Criar um Usuário Admin

### **Passo 1: Gerar o Hash da Senha**

1. Abra o arquivo **`gerar-hash-senha.html`** no navegador
2. Digite a senha desejada (ex: `admin123`)
3. Clique em "Gerar Hash"
4. **Copie o hash gerado** (ex: `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3`)

**OU** use este código JavaScript no Console:

```javascript
// Colar no console do navegador
async function gerarHashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Usar assim:
gerarHashSenha('admin123').then(hash => {
    console.log('Hash da senha:', hash);
});
```

### **Passo 2: Inserir Admin no Banco de Dados**

No **SQL Editor do Supabase**, execute:

```sql
INSERT INTO public.admins (nome, email, senha)
VALUES (
    'Administrador',
    'admin@viagemcerta.com',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
);
```

**Substitua:**
- `'Administrador'` → Nome do admin
- `'admin@viagemcerta.com'` → Email do admin
- `'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'` → Hash da senha

### **Passo 3: Verificar se foi criado**

```sql
SELECT id_admin, nome, email, created_at 
FROM public.admins;
```

---

## 🔐 Como Fazer Login como Admin

1. Acesse **`admin-login.html`**
2. Use as credenciais:
   - Email: `admin@viagemcerta.com`
   - Senha: `admin123` (ou a senha que você definiu)
3. Clique em "Entrar"

### **Se der erro:**

Abra o Console (F12) e veja os logs:

- ✅ `✅ Admin autenticado: Administrador` = Sucesso
- ❌ `❌ Erro na autenticação` = Email/senha incorretos
- ⚠️ `⚠️ Supabase não carregado` = Problema na configuração do Supabase

---

## 🔍 Debug de Problemas de Login

### **Problema 1: "E-mail ou senha incorretos"**

**Causa:** Hash da senha não confere ou admin não existe no banco

**Solução:**

1. Verificar se o admin existe:
```sql
SELECT * FROM public.admins WHERE email = 'admin@viagemcerta.com';
```

2. Gerar novo hash da senha e comparar:
```javascript
gerarHashSenha('admin123').then(hash => {
    console.log('Hash gerado:', hash);
    console.log('Copie este hash e compare com o do banco');
});
```

3. Atualizar senha se necessário:
```sql
UPDATE public.admins 
SET senha = 'NOVO_HASH_AQUI'
WHERE email = 'admin@viagemcerta.com';
```

### **Problema 2: "Sistema em configuração"**

**Causa:** Tabela `admins` não existe no banco

**Solução:**
1. Execute o script SQL para criar a tabela (ver Opção 1 acima)
2. Insira um admin (ver Passo 2 acima)

### **Problema 3: "Sistema temporariamente indisponível"**

**Causa:** Supabase não está configurado ou não carregou

**Solução:**

1. Verifique o arquivo `assets/js/supabase-config.js`:
```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon';
```

2. Verifique se os scripts estão na ordem correta no HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/supabase-config.js"></script>
<script src="assets/js/utils.js"></script>
<script src="assets/js/admin-auth.js"></script>
```

---

## 🚨 Modo de Desenvolvimento

Durante o desenvolvimento, o sistema agora permite acesso temporário mesmo se:
- ⚠️ Supabase não estiver configurado
- ⚠️ Tabela `admins` não existir
- ⚠️ Houver erro na query

Isso facilita o desenvolvimento, mas **não é seguro para produção**.

### **Como Desativar o Modo de Desenvolvimento**

No arquivo `assets/js/admin-dashboard.js`, na função `checkAdminAuth`, **remova** estas linhas:

```javascript
// REMOVER ESTAS LINHAS EM PRODUÇÃO:
if (typeof supabaseClient === 'undefined') {
  console.warn('⚠️ Supabase não carregado, permitindo acesso temporário');
  return true; // <-- REMOVER ESTA LINHA
}
```

E também:

```javascript
// REMOVER ESTAS LINHAS EM PRODUÇÃO:
if (error.code === 'PGRST116' || error.message.includes('relation')) {
  console.warn('⚠️ Tabela admins não existe, permitindo acesso temporário');
  return true; // <-- REMOVER ESTA LINHA
}
```

---

## 📋 Checklist de Configuração

### **Antes de usar o sistema:**

- [ ] Supabase configurado em `supabase-config.js`
- [ ] Tabela `admins` criada no banco
- [ ] Pelo menos 1 admin inserido na tabela
- [ ] Senha hashada corretamente
- [ ] Testado login no `admin-login.html`
- [ ] Console sem erros (F12)

### **Para produção:**

- [ ] Modo de desenvolvimento desativado
- [ ] RLS (Row Level Security) ativo na tabela `admins`
- [ ] Políticas de segurança configuradas
- [ ] Senhas fortes para todos os admins
- [ ] Backup do banco de dados

---

## 🎯 Exemplos de Comandos Úteis

### **Listar todos os admins:**
```sql
SELECT id_admin, nome, email, created_at FROM public.admins;
```

### **Criar novo admin:**
```sql
INSERT INTO public.admins (nome, email, senha)
VALUES ('Seu Nome', 'seu.email@example.com', 'HASH_DA_SENHA_AQUI');
```

### **Deletar admin:**
```sql
DELETE FROM public.admins WHERE email = 'email@example.com';
```

### **Mudar senha de admin:**
```sql
UPDATE public.admins 
SET senha = 'NOVO_HASH_AQUI', updated_at = NOW()
WHERE email = 'email@example.com';
```

### **Ver hash atual de um admin:**
```sql
SELECT email, senha FROM public.admins WHERE email = 'email@example.com';
```

---

## 📞 Suporte

Se ainda tiver problemas:

1. Abra o Console (F12)
2. Copie TODOS os logs (principalmente os que começam com ❌ ou ⚠️)
3. Tire prints da tela
4. Compartilhe para análise

---

**Data:** 06/11/2025  
**Status:** ✅ Sistema de Login Corrigido  
**Versão:** 2.3 - Com tratamento de erros melhorado

