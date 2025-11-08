-- ========================================
-- MIGRAÇÃO: Atualização da Tabela Viagens v2.0
-- Adiciona campos detalhados para endereços e informações de carga/passageiros
-- ========================================

-- IMPORTANTE: Este script é seguro e NÃO apaga dados existentes
-- Pode ser executado múltiplas vezes sem problemas (usa IF NOT EXISTS)

-- ========================================
-- 1. Adicionar Campos Básicos
-- ========================================

ALTER TABLE viagens ADD COLUMN IF NOT EXISTS tipo_servico TEXT DEFAULT 'passageiro';
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS data_viagem DATE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS horario_viagem TIME;

-- ========================================
-- 2. Adicionar Campos de Endereço de Origem
-- ========================================

ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_endereco TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_cep TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_complemento TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_bairro TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_cidade TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS origem_estado TEXT;

-- ========================================
-- 3. Adicionar Campos de Endereço de Destino
-- ========================================

ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_endereco TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_cep TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_complemento TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_bairro TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_cidade TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS destino_estado TEXT;

-- ========================================
-- 4. Adicionar Campos de Transporte de Passageiros
-- ========================================

ALTER TABLE viagens ADD COLUMN IF NOT EXISTS quantidade_passageiros INTEGER;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS necessidades_especiais TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS possui_bagagem BOOLEAN DEFAULT FALSE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS quantidade_bagagens INTEGER;

-- ========================================
-- 5. Adicionar Campos de Transporte de Mercadorias
-- ========================================

ALTER TABLE viagens ADD COLUMN IF NOT EXISTS descricao_carga TEXT;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS peso_kg DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_altura_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_largura_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS dimensao_profundidade_cm DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS valor_declarado DECIMAL(10,2);
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS carga_fragil BOOLEAN DEFAULT FALSE;
ALTER TABLE viagens ADD COLUMN IF NOT EXISTS requer_embalagem_especial BOOLEAN DEFAULT FALSE;

-- ========================================
-- 6. Adicionar Constraint para tipo_servico (se não existir)
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'viagens_tipo_servico_check'
  ) THEN
    ALTER TABLE viagens ADD CONSTRAINT viagens_tipo_servico_check 
      CHECK (tipo_servico IN ('passageiro', 'mercadoria', 'executivo'));
  END IF;
END $$;

-- ========================================
-- 7. Criar Índices para Melhor Performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_viagens_tipo_servico ON viagens(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_viagens_data_viagem ON viagens(data_viagem);
CREATE INDEX IF NOT EXISTS idx_viagens_origem_cidade ON viagens(origem_cidade);
CREATE INDEX IF NOT EXISTS idx_viagens_destino_cidade ON viagens(destino_cidade);

-- ========================================
-- 8. Migrar Dados Existentes (se necessário)
-- ========================================

-- Preencher campos de cidade/estado dos endereços detalhados baseado nos campos antigos
-- (caso os campos origem e destino contenham "cidade - estado")

UPDATE viagens 
SET origem_cidade = TRIM(SPLIT_PART(origem, '-', 1)),
    origem_estado = TRIM(SPLIT_PART(origem, '-', 2))
WHERE origem_cidade IS NULL 
  AND origem LIKE '%-%'
  AND LENGTH(TRIM(SPLIT_PART(origem, '-', 2))) = 2;

UPDATE viagens 
SET destino_cidade = TRIM(SPLIT_PART(destino, '-', 1)),
    destino_estado = TRIM(SPLIT_PART(destino, '-', 2))
WHERE destino_cidade IS NULL 
  AND destino LIKE '%-%'
  AND LENGTH(TRIM(SPLIT_PART(destino, '-', 2))) = 2;

-- ========================================
-- 9. Adicionar Comentários nas Colunas
-- ========================================

COMMENT ON COLUMN viagens.tipo_servico IS 'Tipo de serviço: passageiro, mercadoria ou executivo';
COMMENT ON COLUMN viagens.data_viagem IS 'Data programada para a viagem';
COMMENT ON COLUMN viagens.horario_viagem IS 'Horário programado para a viagem';

COMMENT ON COLUMN viagens.origem_endereco IS 'Endereço completo de origem (rua e número)';
COMMENT ON COLUMN viagens.origem_cep IS 'CEP de origem (formato: 00000-000)';
COMMENT ON COLUMN viagens.origem_complemento IS 'Complemento do endereço de origem (opcional)';
COMMENT ON COLUMN viagens.origem_bairro IS 'Bairro de origem';
COMMENT ON COLUMN viagens.origem_cidade IS 'Cidade de origem';
COMMENT ON COLUMN viagens.origem_estado IS 'Estado de origem (UF)';

COMMENT ON COLUMN viagens.destino_endereco IS 'Endereço completo de destino (rua e número)';
COMMENT ON COLUMN viagens.destino_cep IS 'CEP de destino (formato: 00000-000)';
COMMENT ON COLUMN viagens.destino_complemento IS 'Complemento do endereço de destino (opcional)';
COMMENT ON COLUMN viagens.destino_bairro IS 'Bairro de destino';
COMMENT ON COLUMN viagens.destino_cidade IS 'Cidade de destino';
COMMENT ON COLUMN viagens.destino_estado IS 'Estado de destino (UF)';

COMMENT ON COLUMN viagens.quantidade_passageiros IS 'Quantidade de passageiros (para transporte de pessoas)';
COMMENT ON COLUMN viagens.necessidades_especiais IS 'Necessidades especiais dos passageiros';
COMMENT ON COLUMN viagens.possui_bagagem IS 'Indica se há bagagem';
COMMENT ON COLUMN viagens.quantidade_bagagens IS 'Quantidade de bagagens';

COMMENT ON COLUMN viagens.descricao_carga IS 'Descrição detalhada da carga (para transporte de mercadorias)';
COMMENT ON COLUMN viagens.peso_kg IS 'Peso da carga em quilogramas';
COMMENT ON COLUMN viagens.dimensao_altura_cm IS 'Altura da carga em centímetros';
COMMENT ON COLUMN viagens.dimensao_largura_cm IS 'Largura da carga em centímetros';
COMMENT ON COLUMN viagens.dimensao_profundidade_cm IS 'Profundidade da carga em centímetros';
COMMENT ON COLUMN viagens.valor_declarado IS 'Valor declarado da carga para seguro';
COMMENT ON COLUMN viagens.carga_fragil IS 'Indica se a carga é frágil';
COMMENT ON COLUMN viagens.requer_embalagem_especial IS 'Indica se requer embalagem especial';

-- ========================================
-- 10. Verificação Final
-- ========================================

-- Ver todas as colunas da tabela viagens
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'viagens' 
ORDER BY ordinal_position;

-- ========================================
-- MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✅
-- ========================================

-- Próximos passos:
-- 1. Verifique se todas as colunas foram criadas
-- 2. Teste o novo formulário no dashboard
-- 3. Verifique se dados antigos ainda funcionam

