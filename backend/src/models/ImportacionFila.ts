import { Schema, model, Document, Types } from 'mongoose';

export enum EstadoFila {
  OK = 'OK',
  ERROR = 'ERROR'
}

export interface IImportacionFila extends Document {
  _id: string;
  importacionId: Types.ObjectId;
  filaNumero: number;
  payload: any;
  estado: EstadoFila;
  errores: any[];
  createdAt: Date;
  updatedAt: Date;
}

const importacionFilaSchema = new Schema<IImportacionFila>({
  importacionId: {
    type: Schema.Types.ObjectId,
    ref: 'Importacion',
    required: true
  },
  filaNumero: {
    type: Number,
    required: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  estado: {
    type: String,
    enum: Object.values(EstadoFila),
    default: EstadoFila.OK
  },
  errores: {
    type: Schema.Types.Mixed,
    default: []
  }
}, {
  timestamps: true
});

// Índices
importacionFilaSchema.index({ importacionId: 1, filaNumero: 1 }, { unique: true });
importacionFilaSchema.index({ importacionId: 1, estado: 1 });

export const ImportacionFila = model<IImportacionFila>('ImportacionFila', importacionFilaSchema);