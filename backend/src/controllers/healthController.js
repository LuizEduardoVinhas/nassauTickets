import dbPool from '../config/database.js';

export const checkHealth = async (req, res) => {
    try {
        const connection = await dbPool.getConnection();
        await connection.ping();
        connection.release();

        return res.json({
            status: 'ok',
            message: 'API do nassauTickets está rodando e conectada ao MySQL.',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Erro na conexão com o banco de dados:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Não foi possível conectar ao banco de dados.',
            error: error.message
        });
    }
};