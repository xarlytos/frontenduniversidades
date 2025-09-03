import { Schema, model, Document, Types } from 'mongoose';

export enum EstadoImportacion {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADA = 'COMPLETADA',
  FALLIDA = 'FALLIDA'
}

export interface IImportacion extends Document {
  _id: string;
  usuarioId: Types.ObjectId;
  archivoNombre: string;
  estado: EstadoImportacion;
  totalFilas: number;
  exitosas: number;
  fallidas: number;
  errores: any[];
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const importacionSchema = new Schema<IImportacion>({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  archivoNombre: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: Object.values(EstadoImportacion),
    default: EstadoImportacion.PENDIENTE
  },
  totalFilas: {
    type: Number,
    default: 0
  },
  exitosas: {
    type: Number,
    default: 0
  },
  fallidas: {
    type: Number,
    default: 0
  },
  errores: {
    type: Schema.Types.Mixed,
    default: []
  },
  startedAt: {
    type: Date
  },
  finishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
importacionSchema.index({ usuarioId: 1 });
importacionSchema.index({ estado: 1 });
importacionSchema.index({ createdAt: -1 });

export const Importacion = model<IImportacion>('Importacion', importacionSchema);