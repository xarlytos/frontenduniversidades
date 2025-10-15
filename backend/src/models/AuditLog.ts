import { Schema, model, Document, Types } from 'mongoose';

export enum EntidadAudit {
  CONTACTO = 'CONTACTO',
  USUARIO = 'USUARIO',
  UNIVERSIDAD = 'UNIVERSIDAD',
  TITULACION = 'TITULACION',
  IMPORTACION = 'IMPORTACION'
}

export enum AccionAudit {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT'
}

export interface IAuditLog extends Document {
  _id: string;
  usuarioId: Types.ObjectId;
  entidad: EntidadAudit;
  entidadId: string;
  accion: AccionAudit;
  antes?: any;
  despues?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  entidad: {
    type: String,
    enum: Object.values(EntidadAudit),
    required: true
  },
  entidadId: {
    type: String,
    required: true
  },
  accion: {
    type: String,
    enum: Object.values(AccionAudit),
    required: true
  },
  antes: {
    type: Schema.Types.Mixed
  },
  despues: {
    type: Schema.Types.Mixed
  },
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Índices
auditLogSchema.index({ usuarioId: 1 });
auditLogSchema.index({ entidad: 1, entidadId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ accion: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);