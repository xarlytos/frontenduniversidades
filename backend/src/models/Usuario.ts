import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum RolUsuario {
  ADMIN = 'ADMIN',
  COMERCIAL = 'COMERCIAL'
}

export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO'
}

export interface IUsuario extends Document {
  _id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  ultimoAccesoAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const usuarioSchema = new Schema<IUsuario>({
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: Object.values(RolUsuario),
    required: true
  },
  estado: {
    type: String,
    enum: Object.values(EstadoUsuario),
    default: EstadoUsuario.ACTIVO
  },
  ultimoAccesoAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
usuarioSchema.index({ email: 1 }, { unique: true });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ estado: 1 });

// Método para comparar contraseñas
usuarioSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

// Middleware para hashear contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

export const Usuario = model<IUsuario>('Usuario', usuarioSchema);