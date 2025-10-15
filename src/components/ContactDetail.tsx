import React from 'react';
import { X, Edit, Phone, User, GraduationCap, Calendar, Hash, Instagram } from 'lucide-react';
import { Contact } from '../types';

interface ContactDetailProps {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
}

export default function ContactDetail({ contact, onClose, onEdit }: ContactDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Detalle de Contacto
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{contact.nombre}</h3>
              <p className="text-gray-600">{contact.titulacion} - {contact.universidad}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Teléfono</span>
                </div>
                <p className="text-gray-900">{contact.telefono || 'N/D'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Instagram className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Instagram</span>
                </div>
                <p className="text-gray-900">
                  {contact.instagram ? (
                    <a 
                      href={`https://instagram.com/${contact.instagram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      @{contact.instagram.replace('@', '')}
                    </a>
                  ) : 'N/D'}
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Universidad</span>
                </div>
                <p className="text-gray-900">{contact.universidad}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Titulación</span>
                <p className="text-gray-900">{contact.titulacion}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700">Curso</span>
                <p className="text-gray-900">{contact.curso ? `${contact.curso}º` : 'N/D'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Año de Nacimiento</span>
                </div>
                <p className="text-gray-900">{contact.año_nacimiento || 'N/D'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Comercial</span>
                <p className="text-gray-900">{contact.comercial_nombre || 'N/D'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-700">Día Libre</span>
                <p className="text-gray-900">{contact.dia_libre || 'N/D'}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Fecha de Alta</span>
                </div>
                <p className="text-gray-900">
                  {new Date(contact.fecha_alta).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}