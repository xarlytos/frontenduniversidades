import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Contact } from '../types';
import universidadesService, { Universidad } from '../services/universidadesService';
import titulacionesService from '../services/titulacionesService';

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (contactData: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    instagram: '',
    universidad: '',
    universidadId: '',
    titulacion: '',
    titulacionId: '',
    curso: 1,
    año_nacimiento: undefined as number | undefined,
    email: '',
    aportado_por: '',
    dia_libre: ''
  });

  const [universities, setUniversities] = useState<Universidad[]>([]);
  const [titulaciones, setTitulaciones] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar universidades al montar el componente
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const response = await universidadesService.getUniversidades();
        if (response.success && response.data) {
          setUniversities(response.data);
        }
      } catch (error) {
        console.error('Error loading universities:', error);
      }
    };
    loadUniversities();
  }, []);

  // Cargar titulaciones cuando cambia la universidad
  useEffect(() => {
    const loadTitulaciones = async () => {
      if (formData.universidadId) {
        try {
          const response = await titulacionesService.getTitulacionesByUniversidad(formData.universidadId);
          if (response.success && response.data) {
            setTitulaciones(response.data);
          }
        } catch (error) {
          console.error('Error loading titulaciones:', error);
        }
      } else {
        setTitulaciones([]);
      }
    };
    loadTitulaciones();
  }, [formData.universidadId]);

  // Llenar el formulario si estamos editando
  useEffect(() => {
    if (contact) {
      setFormData({
        nombre: contact.nombre || '',
        telefono: contact.telefono || '',
        instagram: contact.instagram || '',
        universidad: contact.universidad || '',
        universidadId: contact.universidadId || '',
        titulacion: contact.titulacion || '',
        titulacionId: contact.titulacionId || '',
        curso: contact.curso || 1,
        año_nacimiento: contact.año_nacimiento,
        email: contact.email || '',
        aportado_por: contact.aportado_por || '',
        dia_libre: contact.dia_libre || ''
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const submitData = {
      ...formData,
      curso: formData.curso || 1
    };
    
    onSubmit(submitData);
    setLoading(false);
  };

  const handleUniversidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUniversidad = universities.find(u => u._id === e.target.value);
    setFormData({
      ...formData,
      universidadId: e.target.value,
      universidad: selectedUniversidad?.nombre || '',
      titulacion: '',
      titulacionId: ''
    });
  };

  const handleTitulacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      titulacion: e.target.value,
      titulacionId: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Universidad *
              </label>
              <select
                required
                value={formData.universidadId}
                onChange={handleUniversidadChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar universidad</option>
                {universities.map((universidad) => (
                  <option key={universidad._id} value={universidad._id}>
                    {universidad.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulación *
              </label>
              <select
                required
                value={formData.titulacion}
                onChange={handleTitulacionChange}
                disabled={!formData.universidadId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar titulación</option>
                {titulaciones.map((titulacion) => (
                  <option key={titulacion} value={titulacion}>
                    {titulacion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <select
                value={formData.curso}
                onChange={(e) => setFormData({ ...formData, curso: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1º</option>
                <option value={2}>2º</option>
                <option value={3}>3º</option>
                <option value={4}>4º</option>
                <option value={5}>5º</option>
                <option value={6}>6º</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año de Nacimiento
              </label>
              <input
                type="number"
                min="1950"
                max="2010"
                value={formData.año_nacimiento || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  año_nacimiento: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aportado por
              </label>
              <input
                type="text"
                value={formData.aportado_por}
                onChange={(e) => setFormData({ ...formData, aportado_por: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Día libre
              </label>
              <input
                type="text"
                value={formData.dia_libre}
                onChange={(e) => setFormData({ ...formData, dia_libre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (contact ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}