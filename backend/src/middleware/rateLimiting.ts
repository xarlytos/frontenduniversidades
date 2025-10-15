import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';

// Rate limiting general
export const rateLimitMiddleware = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutos
  max: config.rateLimit.max, // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para autenticación
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login por IP
  message: {
    error: 'Demasiados intentos de autenticación',
    message: 'Has excedido el límite de intentos de login. Intenta de nuevo en 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting para endpoints de creación
export const createRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    error: 'Demasiadas creaciones',
    message: 'Has excedido el límite de creaciones por minuto.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimitMiddleware;