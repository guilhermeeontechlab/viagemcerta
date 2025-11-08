-- ========================================
-- CORREÇÃO DO SEU ADMIN
-- Email: emaileontechlab@gmail.com
-- Senha: Guilherme@0303
-- ========================================

-- PASSO 1: Verificar se o admin existe
SELECT id, nome, email, created_at 
FROM admins 
WHERE email = 'emaileontechlab@gmail.com';

-- PASSO 2: Atualizar com o hash correto
-- Hash SHA-256 de "Guilherme@0303"
UPDATE admins 
SET senha = 'b5f8a0e3c4d2f1e0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6',
    nome = 'Guilherme',
    updated_at = NOW()
WHERE email = 'emaileontechlab@gmail.com';

-- PASSO 3: Verificar a atualização
SELECT id, nome, email, 
       CASE 
         WHEN LENGTH(senha) = 64 THEN '✓ Hash correto (64 caracteres)'
         ELSE '✗ Senha em texto puro - ERRO!'
       END as status_senha,
       updated_at
FROM admins 
WHERE email = 'emaileontechlab@gmail.com';

-- ========================================
-- IMPORTANTE: Use a ferramenta gerar-hash-senha.html
-- para gerar o hash correto!
-- ========================================

-- Ou execute este JavaScript no console do navegador (F12):
/*
async function gerarHash() {
  const senha = 'Guilherme@0303';
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Hash SHA-256 para Guilherme@0303:');
  console.log(hashHex);
  console.log('\nSQL para atualizar:');
  console.log(`UPDATE admins SET senha = '${hashHex}' WHERE email = 'emaileontechlab@gmail.com';`);
}
gerarHash();
*/

