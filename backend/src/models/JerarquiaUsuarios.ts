import { Schema, model, Document, Types } from 'mongoose';

export interface IJerarquiaUsuarios extends Document {
  _id: string;
  subordinadoId: Types.ObjectId;
  jefeId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jerarquiaUsuariosSchema = new Schema<IJerarquiaUsuarios>({
  subordinadoId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true // Un subordinado solo puede tener un jefe
  },
  jefeId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
jerarquiaUsuariosSchema.index({ subordinadoId: 1 }, { unique: true });
jerarquiaUsuariosSchema.index({ jefeId: 1 });
jerarquiaUsuariosSchema.index({ subordinadoId: 1, jefeId: 1 });

// Validación para evitar que un usuario sea jefe de sí mismo
jerarquiaUsuariosSchema.pre('save', function(next) {
  if (this.subordinadoId.equals(this.jefeId)) {
    const error = new Error('Un usuario no puede ser jefe de sí mismo');
    return next(error);
  }
  next();
});

export const JerarquiaUsuarios = model<IJerarquiaUsuarios>('JerarquiaUsuarios', jerarquiaUsuariosSchema);