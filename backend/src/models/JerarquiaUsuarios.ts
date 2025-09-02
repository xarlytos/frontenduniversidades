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
    unique: true // Un comercial solo puede tener un jefe
  },
  jefeId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

// Índices
jerarquiaUsuariosSchema.index({ subordinadoId: 1 }, { unique: true });
jerarquiaUsuariosSchema.index({ jefeId: 1 });

// Validación para evitar auto-referencia
jerarquiaUsuariosSchema.pre('save', function(next) {
  if (this.subordinadoId.equals(this.jefeId)) {
    return next(new Error('Un usuario no puede ser jefe de sí mismo'));
  }
  next();
});

export const JerarquiaUsuarios = model<IJerarquiaUsuarios>('JerarquiaUsuarios', jerarquiaUsuariosSchema);