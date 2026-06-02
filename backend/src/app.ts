import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5172',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_PATH || 'uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Z Coffee POS API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
