import dbPool from '../config/database.js';

export const emitirTicketService = async (tipo) => {
    const agora = new Date();
    const yy = String(agora.getFullYear()).slice(-2);
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const dataHoje = `${agora.getFullYear()}-${mm}-${dd}`;

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();

        // Obtém o maior SQ do dia com trava de concorrência
        const [rows] = await connection.query(
            `SELECT MAX(sequencial) AS ultimo_sq
             FROM tickets
             WHERE tipo = ? AND data_emissao = ? FOR UPDATE`,
            [tipo, dataHoje]
        );

        const proximoSq = (rows[0]?.ultimo_sq || 0) + 1;
        const sqFormatado = String(proximoSq).padStart(3, '0');
        const codigoSenha = `${yy}${mm}${dd}-${tipo}${sqFormatado}`;

        const [result] = await connection.query(
            `INSERT INTO tickets
             (codigo_senha, tipo, sequencial, data_emissao, status, data_hora_emissao)
             VALUES (?, ?, ?, ?, 'AGUARDANDO', ?)`,
            [codigoSenha, tipo, proximoSq, dataHoje, agora]
        );

        await connection.commit();

        return {
            id: result.insertId,
            codigo_senha: codigoSenha,
            tipo,
            sequencial: proximoSq,
            status: 'AGUARDANDO',
            data_hora_emissao: agora
        };
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

export const chamarProximoTicketService = async (guiche_id, atendente_id) => {
    const agora = new Date();
    const mm = String(agora.getMonth() + 1).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const dataHoje = `${agora.getFullYear()}-${mm}-${dd}`;

    let connection;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();

        // 1. Identifica o tipo da última senha chamada no dia
        const [ultimaChamadaRows] = await connection.query(
            `SELECT tipo 
             FROM tickets 
             WHERE data_emissao = ? AND status IN ('CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO', 'ATENDIDA')
             ORDER BY data_hora_atendimento DESC, id DESC 
             LIMIT 1`,
            [dataHoje]
        );

        const ultimoTipo = ultimaChamadaRows[0]?.tipo || null;

        // 2. Define a ordem de prioridade conforme a regra intercalada [SP] -> [SE|SG]
        let ordemBusca = (ultimoTipo === 'SP') ? ['SE', 'SG', 'SP'] : ['SP', 'SE', 'SG'];
        let ticketSelecionado = null;

        // 3. Seleciona e bloqueia a senha com FOR UPDATE
        for (const tipoBusca of ordemBusca) {
            const [rows] = await connection.query(
                `SELECT id, codigo_senha, tipo, sequencial, status
                 FROM tickets
                 WHERE data_emissao = ? AND status = 'AGUARDANDO' AND tipo = ?
                 ORDER BY sequencial ASC
                 LIMIT 1
                 FOR UPDATE`,
                [dataHoje, tipoBusca]
            );

            if (rows.length > 0) {
                ticketSelecionado = rows[0];
                break;
            }
        }

        // Fallback para qualquer outra senha aguardando caso a prioridade esteja vazia
        if (!ticketSelecionado) {
            const [rowsFallback] = await connection.query(
                `SELECT id, codigo_senha, tipo, sequencial, status
                 FROM tickets
                 WHERE data_emissao = ? AND status = 'AGUARDANDO'
                 ORDER BY id ASC
                 LIMIT 1
                 FOR UPDATE`,
                [dataHoje]
            );

            if (rowsFallback.length > 0) {
                ticketSelecionado = rowsFallback[0];
            }
        }

        if (!ticketSelecionado) {
            await connection.rollback();
            return null; // Nenhuma senha na fila
        }

        // 4. Atualiza o status da senha para CHAMADA
        await connection.query(
            `UPDATE tickets
             SET status = 'CHAMADA',
                 guiche_id = ?,
                 atendente_id = ?,
                 data_hora_atendimento = ?
             WHERE id = ?`,
            [guiche_id, atendente_id, agora, ticketSelecionado.id]
        );

        // 5. Registra o evento na auditoria
        await connection.query(
            `INSERT INTO logs_auditoria
             (ticket_id, atendente_id, guiche, horario_primeira_chamada)
             VALUES (?, ?, ?, ?)`,
            [ticketSelecionado.id, atendente_id, guiche_id, agora]
        );

        await connection.commit();

        return {
            id: ticketSelecionado.id,
            codigo_senha: ticketSelecionado.codigo_senha,
            tipo: ticketSelecionado.tipo,
            status: 'CHAMADA',
            guiche_id,
            atendente_id,
            horario_chamada: agora
        };
    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (connection) connection.release();
    }
};