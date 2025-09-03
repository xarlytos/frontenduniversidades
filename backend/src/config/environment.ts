import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface DatabaseConfig {
  uri: string;
  name: string;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
}

interface CorsConfig {
  origin: string[];
  credentials: boolean;
}

interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JWTConfig;
  cors: CorsConfig;
  bcryptRounds: number;
  uploadPath: string;
  maxFileSize: number;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private _config: Config;

  private constructor() {
    this._config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadConfig(): Config {
    return {
      server: {
        port: parseInt(process.env.PORT || '3001', 10),
        host: process.env.HOST || 'localhost',
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/university_management',
        name: process.env.DB_NAME || 'university_management'
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
      },
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
        credentials: process.env.CORS_CREDENTIALS === 'true'
      },
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
      }
    };
  }

  private validateConfig(): void {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
      console.warn('⚠️  Using default values - not recommended for production');
    }

    if (this._config.server.nodeEnv === 'production') {
      if (this._config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
        throw new Error('JWT_SECRET must be set in production environment');
      }
    }
  }

  public get config(): Config {
    return this._config;
  }

  public isDevelopment(): boolean {
    return this._config.server.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this._config.server.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this._config.server.nodeEnv === 'test';
  }
}

export const environmentConfig = EnvironmentConfig.getInstance();
export const config = environmentConfig.config;
export default config;