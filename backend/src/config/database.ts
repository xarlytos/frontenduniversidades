import mongoose from 'mongoose';
import { config } from './environment';
import bcrypt from 'bcryptjs';

class DatabaseConfig {
  private static instance: DatabaseConfig;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        console.log('✅ Database already connected');
        return;
      }

      await mongoose.connect(config.database.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      
      // Crear índices
      await this.createIndexes();
      
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private async createIndexes(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      
      // Índices para usuarios
      await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
      
      // Índices para contactos
      await db.collection('contactos').createIndex({ email: 1 });
      await db.collection('contactos').createIndex({ universidad: 1 });
      await db.collection('contactos').createIndex({ titulacion: 1 });
      await db.collection('contactos').createIndex({ curso: 1 });
      await db.collection('contactos').createIndex({ createdBy: 1 });
      
      // Índices para auditoría
      await db.collection('audit_logs').createIndex({ timestamp: 1 });
      await db.collection('audit_logs').createIndex({ userId: 1 });
      await db.collection('audit_logs').createIndex({ action: 1 });
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }


}

export const database = DatabaseConfig.getInstance();
export const connectDB = () => database.connect();
export default database;