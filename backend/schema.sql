CREATE DATABASE IF NOT EXISTS nassauTickets;
USE nassauTickets;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('atendente', 'gestor') DEFAULT 'atendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_senha VARCHAR(20) UNIQUE NOT NULL, 
    tipo ENUM('SP', 'SG', 'SE') NOT NULL,    
    sequencial INT NOT NULL,                
    data_emissao DATE NOT NULL,             
    status ENUM(
        'EMITIDA',
        'AGUARDANDO',
        'CHAMADA',
        'CHAMADA_NOVAMENTE',
        'EM_ATENDIMENTO',
        'ATENDIDA',
        'NAO_COMPARECEU'
    ) DEFAULT 'EMITIDA',
    data_hora_emissao DATETIME NOT NULL,
    data_hora_atendimento DATETIME NULL,
    guiche_id INT NULL,
    atendente_id INT NULL,
    FOREIGN KEY (atendente_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    atendente_id INT NOT NULL,
    guiche INT NOT NULL,
    horario_primeira_chamada DATETIME NULL,
    horario_segunda_chamada DATETIME NULL,
    horario_inicio DATETIME NULL,
    horario_fim DATETIME NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (atendente_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_data_status_tipo ON tickets (data_emissao, status, tipo);