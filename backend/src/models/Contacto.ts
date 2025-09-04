import { Schema, model, Document, Types } from 'mongoose';

// Resolver conflicto en la interfaz
export interface IContacto extends Document {
  _id: string;
  universidadId: Types.ObjectId;
  titulacionId: Types.ObjectId;
  curso: number;
  nombreCompleto: string;
  telefono?: string;
  instagram?: string;
  anioNacimiento?: number;
  comercialId: Types.ObjectId;
  fechaAlta: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  diaLibre?: string; // ← Mantener este campo
}

// Resolver conflicto en el schema
const contactoSchema = new Schema<IContacto>({
  universidadId: {
    type: Schema.Types.ObjectId,
    ref: 'Universidad',
    required: true
  },
  titulacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Titulacion',
    required: true
  },
  curso: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  nombreCompleto: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  telefono: {
    type: String,
    trim: true,
    // Validación más permisiva para teléfonos
    match: /^[+]?[0-9\s\-\(\)\.]{7,20}$/
  },
  instagram: {
    type: String,
    trim: true,
    maxlength: 30,
    // Permitir puntos y otros caracteres comunes en Instagram
    match: /^[a-zA-Z0-9_\-\.]+$/
  },
  anioNacimiento: {
    type: Number,
    min: 1950,
    max: new Date().getFullYear()
  },
  comercialId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaAlta: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  diaLibre: {
    type: String,
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    required: false
  }
}, {
  timestamps: true
});

// Validación: debe tener al menos teléfono o instagram
contactoSchema.pre('save', function(next) {
  if (!this.telefono && !this.instagram) {
    return next(new Error('El contacto debe tener al menos teléfono o Instagram'));
  }
  next();
});

// Índices
contactoSchema.index({ universidadId: 1, titulacionId: 1, curso: 1 });
contactoSchema.index({ nombreCompleto: 'text' });
contactoSchema.index({ telefono: 1 });
contactoSchema.index({ instagram: 1 });
contactoSchema.index({ comercialId: 1 });
contactoSchema.index({ fechaAlta: 1 });

export const Contacto = model<IContacto>('Contacto', contactoSchema);