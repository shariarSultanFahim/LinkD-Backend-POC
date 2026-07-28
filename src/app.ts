import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Central Error Handler
app.use(errorHandler);

export default app;
