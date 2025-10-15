import { Schema, model, Document } from 'mongoose';

export interface IPermiso extends Document {
  _id: string;
  clave: string;
  descripcion: string;
  createdAt: Date;
  updatedAt: Date;
}

const permisoSchema = new Schema<IPermiso>({
  clave: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
permisoSchema.index({ clave: 1 }, { unique: true });

export const Permiso = model<IPermiso>('Permiso', permisoSchema);