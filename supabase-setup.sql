-- ========================================
-- Viagem Certa - Setup do Banco de Dados
-- Execute este script no Supabase SQL Editor
-- ========================================

-- 1. Criar tabela de cadastros (usuários)
CREATE TABLE IF NOT EXISTS cadastros (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  senha TEXT NOT NULL,
  cpf TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela de viagens
CREATE TABLE IF NOT EXISTS viagens (
  id_viagem SERIAL PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  email_cliente TEXT,
  
  -- Informações básicas
  tipo_servico TEXT DEFAULT 'passageiro' CHECK (tipo_servico IN ('passageiro', 'mercadoria', 'executivo')),
  data_viagem DATE,
  horario_viagem TIME,
  
  -- Endereços (mantidos para compatibilidade)
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  
  -- Endereço de Origem (detalhado)
  origem_endereco TEXT,
  origem_cep TEXT,
  origem_complemento TEXT,
  origem_bairro TEXT,
  origem_cidade TEXT,
  origem_estado TEXT,
  
  -- Endereço de Destino (detalhado)
  destino_endereco TEXT,
  destino_cep TEXT,
  destino_complemento TEXT,
  destino_bairro TEXT,
  destino_cidade TEXT,
  destino_estado TEXT,
  
  -- Transporte de Passageiros
  quantidade_passageiros INTEGER,
  necessidades_especiais TEXT,
  possui_bagagem BOOLEAN DEFAULT FALSE,
  quantidade_bagagens INTEGER,
  
  -- Transporte de Mercadorias
  descricao_carga TEXT,
  peso_kg DECIMAL(10,2),
  dimensao_altura_cm DECIMAL(10,2),
  dimensao_largura_cm DECIMAL(10,2),
  dimensao_profundidade_cm DECIMAL(10,2),
  valor_declarado DECIMAL(10,2),
  carga_fragil BOOLEAN DEFAULT FALSE,
  requer_embalagem_especial BOOLEAN DEFAULT FALSE,
  
  -- Observações e Status
  observacao TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendado', 'ativo', 'concluido', 'cancelado')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir (migração segura)
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS email_cliente TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS tipo_servico TEXT DEFAULT 'passageiro';
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS data_viagem DATE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS horario_viagem TIME;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_endereco TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_cep TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_complemento TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_bairro TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_cidade TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_estado TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_endereco TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_cep TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_complemento TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_bairro TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_cidade TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_estado TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS quantidade_passageiros INTEGER;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS necessidades_especiais TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS possui_bagagem BOOLEAN DEFAULT FALSE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS quantidade_bagagens INTEGER;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS descricao_carga TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS peso_kg DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_altura_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_largura_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_profundidade_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS valor_declarado DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS carga_fragil BOOLEAN DEFAULT FALSE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS requer_embalagem_especial BOOLEAN DEFAULT FALSE;

-- 3. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cadastros_email ON cadastros(email);
CREATE INDEX IF NOT EXISTS idx_viagens_nome_cliente ON viagens(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_viagens_email_cliente ON viagens(email_cliente);
CREATE INDEX IF NOT EXISTS idx_viagens_status ON viagens(status);
CREATE INDEX IF NOT EXISTS idx_viagens_created_at ON viagens(created_at DESC);

-- 4. Comentários nas tabelas
COMMENT ON TABLE cadastros IS 'Tabela de cadastros de usuários/clientes';
COMMENT ON TABLE viagens IS 'Tabela de solicitações de viagens/transportes';

COMMENT ON COLUMN cadastros.id IS 'ID único do cadastro';
COMMENT ON COLUMN cadastros.nome IS 'Nome completo do cliente';
COMMENT ON COLUMN cadastros.email IS 'E-mail único do cliente';
COMMENT ON COLUMN cadastros.telefone IS 'Telefone de contato';
COMMENT ON COLUMN cadastros.senha IS 'Hash SHA-256 da senha';
COMMENT ON COLUMN cadastros.cpf IS 'CPF do cliente (opcional)';
COMMENT ON COLUMN cadastros.created_at IS 'Data de criação do cadastro';

COMMENT ON COLUMN viagens.id_viagem IS 'ID único da viagem';
COMMENT ON COLUMN viagens.nome_cliente IS 'Nome do cliente que solicitou';
COMMENT ON COLUMN viagens.origem IS 'Cidade de origem';
COMMENT ON COLUMN viagens.destino IS 'Cidade de destino';
COMMENT ON COLUMN viagens.observacao IS 'Observações adicionais (opcional)';
COMMENT ON COLUMN viagens.status IS 'Status da viagem: pendente, agendado, ativo, concluido, cancelado';
COMMENT ON COLUMN viagens.created_at IS 'Data de criação da solicitação';

-- 5. Inserir dados de exemplo (OPCIONAL - remover em produção)
-- INSERT INTO cadastros (nome, email, telefone, senha, cpf) VALUES
--   ('João Silva', 'joao@email.com', '(79) 9 9999-9999', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '123.456.789-00');
-- 
-- INSERT INTO viagens (nome_cliente, origem, destino, observacao, status) VALUES
--   ('João Silva', 'Salvador - BA', 'Aracaju - SE', 'Viagem de negócios', 'agendado'),
--   ('João Silva', 'Aracaju - SE', 'Salvador - BA', 'Retorno', 'pendente');

-- ========================================
-- Configuração de Segurança (RLS)
-- ========================================

-- NOTA: Como estamos usando tabelas customizadas sem auth.users do Supabase,
-- o Row Level Security (RLS) não será aplicado automaticamente.
-- A segurança é gerenciada no lado do cliente através de verificações.

-- Para habilitar RLS (opcional, mas não será usado neste projeto):
-- ALTER TABLE cadastros ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE viagens ENABLE ROW LEVEL SECURITY;

-- 6. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  viagem_id INTEGER REFERENCES viagens(id_viagem) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('aceito', 'recusado', 'cancelado', 'atualizado', 'info')),
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Adicionar campo updated_at nas tabelas
ALTER TABLE cadastros ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 8. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Criar triggers para updated_at
DROP TRIGGER IF EXISTS update_cadastros_updated_at ON cadastros;
CREATE TRIGGER update_cadastros_updated_at
  BEFORE UPDATE ON cadastros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_viagens_updated_at ON viagens;
CREATE TRIGGER update_viagens_updated_at
  BEFORE UPDATE ON viagens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Criar índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_email ON notificacoes(user_email);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(created_at DESC);

-- 11. Comentários na tabela de notificações
COMMENT ON TABLE notificacoes IS 'Tabela de notificações em tempo real para usuários';
COMMENT ON COLUMN notificacoes.id IS 'ID único da notificação';
COMMENT ON COLUMN notificacoes.user_email IS 'Email do usuário que receberá a notificação';
COMMENT ON COLUMN notificacoes.viagem_id IS 'ID da viagem relacionada';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação: aceito, recusado, cancelado, atualizado, info';
COMMENT ON COLUMN notificacoes.mensagem IS 'Mensagem da notificação';
COMMENT ON COLUMN notificacoes.lida IS 'Se a notificação foi lida pelo usuário';
COMMENT ON COLUMN notificacoes.created_at IS 'Data de criação da notificação';

-- 12. Função para criar notificação automaticamente quando status de viagem mudar
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  user_email_var TEXT;
  mensagem_var TEXT;
  tipo_var TEXT;
BEGIN
  -- Buscar email do usuário pela viagem
  SELECT email INTO user_email_var
  FROM cadastros
  WHERE nome = NEW.nome_cliente
  LIMIT 1;
  
  -- Se o status mudou e não é mais pendente
  IF OLD.status = 'pendente' AND NEW.status != 'pendente' THEN
    -- Definir tipo e mensagem baseado no novo status
    CASE NEW.status
      WHEN 'agendado' THEN
        tipo_var := 'aceito';
        mensagem_var := 'Sua solicitação de viagem de ' || NEW.origem || ' para ' || NEW.destino || ' foi aceita!';
      WHEN 'ativo' THEN
        tipo_var := 'aceito';
        mensagem_var := 'Sua viagem de ' || NEW.origem || ' para ' || NEW.destino || ' está em andamento!';
      WHEN 'cancelado' THEN
        tipo_var := 'cancelado';
        mensagem_var := 'Sua solicitação de viagem de ' || NEW.origem || ' para ' || NEW.destino || ' foi cancelada.';
      ELSE
        tipo_var := 'atualizado';
        mensagem_var := 'Status da sua viagem atualizado para: ' || NEW.status;
    END CASE;
    
    -- Inserir notificação se encontrou o email
    IF user_email_var IS NOT NULL THEN
      INSERT INTO notificacoes (user_email, viagem_id, tipo, mensagem, lida)
      VALUES (user_email_var, NEW.id_viagem, tipo_var, mensagem_var, FALSE);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Criar trigger para notificações automáticas
DROP TRIGGER IF EXISTS trigger_notify_status_change ON viagens;
CREATE TRIGGER trigger_notify_status_change
  AFTER UPDATE ON viagens
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_status_change();

-- ========================================
-- 14. Tabela de Administradores
-- ========================================

-- Criar tabela de admins
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice para email
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Comentários na tabela
COMMENT ON TABLE admins IS 'Tabela de administradores do sistema';
COMMENT ON COLUMN admins.id IS 'ID único do administrador';
COMMENT ON COLUMN admins.nome IS 'Nome completo do administrador';
COMMENT ON COLUMN admins.email IS 'E-mail único do administrador';
COMMENT ON COLUMN admins.senha IS 'Hash SHA-256 da senha';
COMMENT ON COLUMN admins.created_at IS 'Data de criação do cadastro';
COMMENT ON COLUMN admins.updated_at IS 'Data da última atualização';

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir admin padrão (senha: Admin@2025)
-- Hash SHA-256 de "Admin@2025"
INSERT INTO admins (nome, email, senha) VALUES
  ('Administrador', 'admin@brunotransportes.com', '59ec5e64f5b04a6ddbd07c5f63c59c5e3b9bc3c32f7b9e4e3d5e0d88f5dd3c6e')
ON CONFLICT (email) DO NOTHING;

-- NOTA: A senha padrão é "Admin@2025"
-- Para alterar a senha de um admin, use:
-- UPDATE admins SET senha = 'NOVO_HASH_SHA256' WHERE email = 'admin@brunotransportes.com';

-- ========================================
-- Fim do Script
-- ========================================

-- Para verificar se as tabelas foram criadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Para ver dados:
-- SELECT * FROM cadastros;
-- SELECT * FROM viagens;
-- SELECT * FROM notificacoes;
-- SELECT * FROM admins;

