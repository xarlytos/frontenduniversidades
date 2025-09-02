import { Schema, model, Document, Types } from 'mongoose';

export interface IUsuarioPermiso extends Document {
  usuarioId: Types.ObjectId;
  permisoId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const usuarioPermisoSchema = new Schema<IUsuarioPermiso>({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  permisoId: {
    type: Schema.Types.ObjectId,
    ref: 'Permiso',
    required: true
  }
}, {
  timestamps: true
});

// Índices
usuarioPermisoSchema.index({ usuarioId: 1, permisoId: 1 }, { unique: true });
usuarioPermisoSchema.index({ usuarioId: 1 });

export const UsuarioPermiso = model<IUsuarioPermiso>('UsuarioPermiso', usuarioPermisoSchema);