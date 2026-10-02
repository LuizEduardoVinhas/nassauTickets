import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/healthRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

app.use('/api/health', healthRoutes);          
app.use('/api/tickets', ticketRoutes);  

export default app;