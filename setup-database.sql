-- ========================================
-- SCRIPT SQL COMPLETO - NEON DATABASE
-- Sistema Motorista Particular BC
-- ========================================

-- DATABASE: motorista_particular_bc

-- ========================================
-- CRIAR TABELAS
-- ========================================

-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(100),
    email VARCHAR(100),
    telefone VARCHAR(20),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP
);

-- Tabela de contatos novos
CREATE TABLE contatos_novos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT,
    data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id)
);

-- Tabela de contatos salvos
CREATE TABLE contatos_salvos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT,
    data_original TIMESTAMP,
    data_salvo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    observacoes TEXT
);

-- Tabela de histórico de interações
CREATE TABLE historico_interacoes (
    id SERIAL PRIMARY KEY,
    contato_id INTEGER,
    tipo_contato VARCHAR(20),
    tipo_interacao VARCHAR(20),
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id)
);

-- ========================================
-- CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_contatos_novos_usuario ON contatos_novos(usuario_id);
CREATE INDEX idx_contatos_salvos_usuario ON contatos_salvos(usuario_id);
CREATE INDEX idx_historico_usuario ON historico_interacoes(usuario_id);
CREATE INDEX idx_historico_data ON historico_interacoes(data_interacao);

-- ========================================
-- INSERIR DADOS INICIAIS
-- ========================================

-- Inserir usuário único do sistema (login: 123 / senha: 456)
INSERT INTO usuarios (username, password, nome_completo) 
VALUES ('123', '456', 'Motorista BC');

-- Inserir contatos de teste
INSERT INTO contatos_novos (nome, email, telefone, mensagem) VALUES
('João Silva', 'joao.silva@email.com', '(11) 98765-4321', 'Gostaria de saber mais informações sobre os serviços oferecidos.'),
('Maria Santos', 'maria.santos@email.com', '(21) 99876-5432', 'Preciso de um orçamento para uma viagem em grupo.'),
('Carlos Oliveira', 'carlos.oliveira@email.com', '(47) 98888-7777', 'Quando vocês têm disponibilidade para o mês de dezembro?');

-- ========================================
-- FIM DO SCRIPT
-- ========================================
