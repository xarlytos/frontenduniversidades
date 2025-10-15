import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import contactosRoutes from './routes/contactosRoutes';
import estadisticasRoutes from './routes/estadisticasRoutes';
import usuariosRoutes from './routes/usuariosRoutes';
import universidadesRoutes from './routes/universidadesRoutes';
import titulacionesRoutes from './routes/titulacionesRoutes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://frontenduniversidades.vercel.app'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de todas las peticiones
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Body:`, req.body);
  next();
});

// Conectar a la base de datos
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas públicas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Rutas protegidas (aplicar middleware individualmente)
app.use('/api/contactos', authenticateToken, contactosRoutes);
app.use('/api/estadisticas', authenticateToken, estadisticasRoutes);
app.use('/api/universidades', authenticateToken, universidadesRoutes);
app.use('/api/titulaciones', authenticateToken, titulacionesRoutes);

// COMENTAR O ELIMINAR esta línea problemática:
// app.use('/api', authenticateToken);

// Middleware de manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

export default app;