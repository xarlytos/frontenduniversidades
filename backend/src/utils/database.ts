import mongoose from 'mongoose';

export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

export class DatabaseUtils {
  /**
   * Registra una acción en el log de auditoría
   */
  static async logAuditAction(auditData: AuditLog): Promise<void> {
    try {
      const db = mongoose.connection.db;
      await db.collection('audit_logs').insertOne({
        ...auditData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }

  /**
   * Limpia logs de auditoría antiguos (más de 90 días)
   */
  static async cleanOldAuditLogs(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const result = await db.collection('audit_logs').deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      console.log(`🧹 Cleaned ${result.deletedCount} old audit logs`);
    } catch (error) {
      console.error('Error cleaning old audit logs:', error);
    }
  }

  /**
   * Verifica el estado de salud de la base de datos
   */
  static async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      
      // Verificar estado de la conexión
      const serverStatus = await adminDb.serverStatus();
      const dbStats = await db.stats();
      
      return {
        status: 'healthy',
        details: {
          connectionState: mongoose.connection.readyState,
          serverVersion: serverStatus.version,
          uptime: serverStatus.uptime,
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize
        }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          connectionState: mongoose.connection.readyState
        }
      };
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  static async getDatabaseStats(): Promise<any> {
    try {
      const db = mongoose.connection.db;
      const collections = ['usuarios', 'contactos', 'universidades', 'titulaciones', 'audit_logs'];
      
      const stats: any = {};
      
      for (const collection of collections) {
        const count = await db.collection(collection).countDocuments();
        stats[collection] = { count };
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }
}

export default DatabaseUtils;