import { Schema, model, Document, Types } from 'mongoose';

export interface IUniversidad extends Document {
  _id: string;
  codigo: string;  // UV, UPV, CEU, etc.
  nombre: string;  // Nombre completo de la universidad
  estado: 'activa' | 'inactiva';
  creadoPor: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const universidadSchema = new Schema<IUniversidad>({
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
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
  }
}, {
  timestamps: true
});

// Índices
universidadSchema.index({ codigo: 1 }, { unique: true });
universidadSchema.index({ nombre: 1 }, { unique: true });
universidadSchema.index({ estado: 1 });

export const Universidad = model<IUniversidad>('Universidad', universidadSchema);