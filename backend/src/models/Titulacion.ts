import { Schema, model, Document, Types } from 'mongoose';

export interface ITitulacion extends Document {
  _id: string;
  universidadId: Types.ObjectId;
  nombre: string;
  codigo: string;
  tipo: string;
  duracion?: number;
  creditos?: number;
  modalidad?: string;
  descripcion?: string;
  area?: string;
  orden: number;
  estado: 'activa' | 'inactiva';
  creadoPor: Types.ObjectId;
  fechaActualizacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const titulacionSchema = new Schema<ITitulacion>({
  universidadId: {
    type: Schema.Types.ObjectId,
    ref: 'Universidad',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  codigo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  tipo: {
    type: String,
    required: true,
    enum: ['grado', 'master', 'doctorado', 'fp'],
    default: 'grado'
  },
  duracion: {
    type: Number,
    min: 1,
    max: 10
  },
  creditos: {
    type: Number,
    min: 60,
    max: 500
  },
  modalidad: {
    type: String,
    enum: ['presencial', 'online', 'semipresencial'],
    default: 'presencial'
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  area: {
    type: String,
    trim: true,
    maxlength: 100
  },
  orden: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['activa', 'inactiva'],
    default: 'activa'
  },
  creadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices
titulacionSchema.index({ universidadId: 1, codigo: 1 }, { unique: true });
titulacionSchema.index({ universidadId: 1, nombre: 1 }, { unique: true });
titulacionSchema.index({ universidadId: 1, orden: 1 });
titulacionSchema.index({ tipo: 1 });
titulacionSchema.index({ estado: 1 });

export const Titulacion = model<ITitulacion>('Titulacion', titulacionSchema);