-- ====================================
-- CONFIGURAÇÃO COMPLETA DO SUPABASE
-- Execute este SQL no SQL Editor do Supabase
-- ====================================

-- IMPORTANTE: Este SQL configura as políticas RLS (Row Level Security)
-- necessárias para o app funcionar corretamente

-- ====================================
-- 1. TABELA USUARIOS
-- ====================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Permitir todas as operações em usuarios (simplificado para MVP)
CREATE POLICY "Permitir todas operacoes em usuarios" 
ON usuarios 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================
-- 2. TABELA CATEGORIAS
-- ====================================
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

-- Permitir todas as operações em categorias
CREATE POLICY "Permitir todas operacoes em categorias" 
ON categorias 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================
-- 3. TABELA LOCAIS
-- ====================================
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;

-- Permitir todas as operações em locais
CREATE POLICY "Permitir todas operacoes em locais" 
ON locais 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================
-- 4. TABELA EVENTOS
-- ====================================
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Permitir todas as operações em eventos
CREATE POLICY "Permitir todas operacoes em eventos" 
ON eventos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================
-- 5. TABELA FAVORITOS
-- ====================================
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Permitir todas as operações em favoritos
CREATE POLICY "Permitir todas operacoes em favoritos" 
ON favoritos 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================
-- VERIFICAÇÃO
-- ====================================
-- Execute esta query para verificar se as políticas foram criadas:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ====================================
-- DADOS INICIAIS (se ainda não existirem)
-- ====================================

-- IMPORTANTE: Configurar CASCADE para deletar favoritos quando evento for deletado
-- Se a constraint já existe, ela será recriada com CASCADE
DO $$
BEGIN
    -- Remove constraint antiga se existir
    ALTER TABLE favoritos DROP CONSTRAINT IF EXISTS favoritos_evento_id_fkey;
    
    -- Adiciona constraint com ON DELETE CASCADE
    ALTER TABLE favoritos 
    ADD CONSTRAINT favoritos_evento_id_fkey 
    FOREIGN KEY (evento_id) 
    REFERENCES eventos(id) 
    ON DELETE CASCADE;
    
    -- Remove constraint antiga de usuario_id se existir
    ALTER TABLE favoritos DROP CONSTRAINT IF EXISTS favoritos_usuario_id_fkey;
    
    -- Adiciona constraint com ON DELETE CASCADE
    ALTER TABLE favoritos 
    ADD CONSTRAINT favoritos_usuario_id_fkey 
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios(id) 
    ON DELETE CASCADE;
    
    -- NOVO: Configurar CASCADE para deletar eventos quando local for deletado
    ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_local_id_fkey;
    
    ALTER TABLE eventos 
    ADD CONSTRAINT eventos_local_id_fkey 
    FOREIGN KEY (local_id) 
    REFERENCES locais(id) 
    ON DELETE CASCADE;
    
    -- NOVO: Configurar CASCADE para deletar eventos quando categoria for deletada
    ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_categoria_id_fkey;
    
    ALTER TABLE eventos 
    ADD CONSTRAINT eventos_categoria_id_fkey 
    FOREIGN KEY (categoria_id) 
    REFERENCES categorias(id) 
    ON DELETE CASCADE;
END $$;

-- Inserir categorias padrão (se não existirem)
INSERT INTO categorias (nome) 
SELECT nome FROM (
    VALUES 
        ('Música'),
        ('Esportes'),
        ('Cultura'),
        ('Gastronomia'),
        ('Teatro'),
        ('Cinema'),
        ('Educação'),
        ('Tecnologia')
) AS t(nome)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias WHERE categorias.nome = t.nome
);

-- Verificar se há usuários cadastrados
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Verificar se há eventos cadastrados
SELECT COUNT(*) as total_eventos FROM eventos;

-- ====================================
-- NOTA IMPORTANTE
-- ====================================
-- Após executar este SQL:
-- 1. Verifique se as políticas foram criadas com sucesso
-- 2. Teste o login no app com: randersonteste@gmail.com / 12345
-- 3. Tente criar um novo evento
-- 4. Se ainda houver erros, verifique os logs no console do app
