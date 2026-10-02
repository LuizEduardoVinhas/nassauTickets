import dbPool from '../config/database.js';
import { emitirTicketService, chamarProximoTicketService } from '../services/ticketService.js';

export const emitirTicket = async (req, res) => {
    const { tipo } = req.body;

    if (!['SP', 'SG', 'SE'].includes(tipo)) {
        return res.status(400).json({
            error: 'Tipo de senha inválido. Utilize SP, SG ou SE.'
        });
    }

    try {
        const ticket = await emitirTicketService(tipo);
        return res.status(201).json({
            message: 'Senha emitida com sucesso!',
            ticket
        });
    } catch (error) {
        console.error('Erro ao emitir senha:', error);
        return res.status(500).json({ error: 'Falha ao gerar a senha.' });
    }
};

export const chamarProximoTicket = async (req, res) => {
    const { guiche_id, atendente_id } = req.body;

    if (!guiche_id || !atendente_id) {
        return res.status(400).json({
            error: 'É necessário informar guiche_id e atendente_id.'
        });
    }

    try {
        const ticket = await chamarProximoTicketService(guiche_id, atendente_id);

        if (!ticket) {
            return res.status(404).json({
                message: 'Não há senhas aguardando atendimento na fila no momento.'
            });
        }

        return res.status(200).json({
            message: 'Próxima senha chamada com sucesso!',
            ticket
        });
    } catch (error) {
        console.error('Erro ao chamar próxima senha:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const obterPainel = async (req, res) => {
    try {
        const [tickets] = await dbPool.query(
            `SELECT codigo_senha, tipo, guiche_id, status, data_hora_atendimento 
             FROM tickets 
             WHERE status IN ('CHAMADA', 'CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO') 
             ORDER BY data_hora_atendimento DESC LIMIT 5`
        );
        return res.status(200).json(tickets);
    } catch (error) {
        console.error('Erro ao obter painel de senhas:', error);
        return res.status(500).json({ error: 'Erro ao carregar o painel.' });
    }
};