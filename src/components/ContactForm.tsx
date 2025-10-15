import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Contact } from '../types';
import { getUniversities } from '../data/universitiesData';
import { useContacts } from '../hooks/useContacts';
import { useAuth } from '../hooks/useAuth';
import universidadesService, { Universidad } from '../services/universidadesService';

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const { checkDuplicates } = useContacts();
  const { users, getAllUsers, user } = useAuth();
  
  const [formData, setFormData] = useState({
    universidad: '',
    universidadId: '',
    titulacion: '',
    titulacionId: '',
    nombre: '',
    curso: null as number | null,
    telefono: '',
    instagram: '',
    año_nacimiento: null as number | null,
    comercial: '',
    dia_libre: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTitulaciones, setAvailableTitulaciones] = useState<string[]>([]);
  const [universities, setUniversities] = useState<Universidad[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  // Cargar universidades desde la API
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        console.log('Cargando universidades desde la API...');
        const universitiesData = await universidadesService.getUniversidades();
        console.log('Datos de universidades recibidos:', universitiesData);
        console.log('Número de universidades:', universitiesData.length);
        setUniversities(universitiesData);
      } catch (error) {
        console.error('Error al cargar universidades:', error);
      } finally {
        setLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, []);

  // Cargar usuarios comerciales
  useEffect(() => {
    const loadComerciales = async () => {
      try {
        console.log('Cargando usuarios comerciales...');
        await getAllUsers();
        console.log('Usuarios comerciales cargados:', users);
      } catch (error) {
        console.error('Error al cargar usuarios comerciales:', error);
      }
    };

    loadComerciales();
  }, [getAllUsers]);

  useEffect(() => {
    if (contact) {
      setFormData({
        universidad: contact.universidad,
        universidadId: '', // Se llenará cuando se carguen las universidades
        titulacion: contact.titulacion,
        titulacionId: '', // Se llenará cuando se carguen las titulaciones
        nombre: contact.nombre,
        curso: contact.curso,
        telefono: contact.telefono || '',
        instagram: contact.instagram || '',
        año_nacimiento: contact.año_nacimiento || null,
        comercial: contact.comercial_id || '',
        dia_libre: contact.dia_libre || ''
      });
      
      // Cargar titulaciones para la universidad del contacto desde los datos de la API
      if (contact.universidad && universities.length > 0) {
        const selectedUniversity = universities.find(uni => uni.nombre === contact.universidad);
        if (selectedUniversity && selectedUniversity.titulaciones) {
          const titulacionesNames = selectedUniversity.titulaciones.map(tit => tit.nombre);
          setAvailableTitulaciones(titulacionesNames);
        }
      }
    }
  }, [contact, universities]);

  const handleUniversidadChange = (universidad: string) => {
    const selectedUniversity = universities.find(uni => uni.nombre === universidad);
    
    setFormData(prev => ({
      ...prev,
      universidad,
      universidadId: selectedUniversity?._id || '',
      titulacion: '', // Reset titulación cuando cambia la universidad
      titulacionId: '' // Reset titulación ID cuando cambia la universidad
    }));
    
    // Actualizar titulaciones disponibles desde los datos de la API
    if (universidad && selectedUniversity) {
      console.log('Universidad seleccionada:', selectedUniversity);
      
      if (selectedUniversity.titulaciones) {
        const titulacionesNames = selectedUniversity.titulaciones.map(tit => tit.nombre);
        console.log('Titulaciones disponibles:', titulacionesNames);
        setAvailableTitulaciones(titulacionesNames);
      } else {
        console.log('No se encontraron titulaciones para la universidad:', universidad);
        setAvailableTitulaciones([]);
      }
    } else {
      setAvailableTitulaciones([]);
    }
    
    // Limpiar error de universidad si existe
    if (errors.universidad) {
      setErrors(prev => ({ ...prev, universidad: '' }));
    }
  };

  const handleTitulacionChange = (titulacion: string) => {
    const selectedUniversity = universities.find(uni => uni.nombre === formData.universidad);
    const selectedTitulacion = selectedUniversity?.titulaciones?.find(tit => tit.nombre === titulacion);
    
    setFormData(prev => ({
      ...prev,
      titulacion,
      titulacionId: selectedTitulacion?._id || ''
    }));
    
    // Limpiar error de titulación si existe
    if (errors.titulacion) {
      setErrors(prev => ({ ...prev, titulacion: '' }));
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Es opcional
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,15}$/;
    return phoneRegex.test(phone);
  };

  const validateBirthYear = (year: number | null) => {
    if (year === null) return true; // Es opcional
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  };

  const validateInstagram = (instagram: string) => {
    if (!instagram) return true; // Es opcional
    // Remover @ si está presente y validar formato
    const cleanInstagram = instagram.replace('@', '');
    const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return instagramRegex.test(cleanInstagram);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Campos obligatorios
    if (!formData.universidad.trim()) {
      newErrors.universidad = 'La universidad es requerida';
    }

    if (!formData.titulacion.trim()) {
      newErrors.titulacion = 'La titulación es requerida';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (formData.curso === null || formData.curso < 1 || formData.curso > 6) {
      newErrors.curso = 'El curso es requerido y debe estar entre 1 y 6';
    }

    // Validación: al menos uno entre teléfono e Instagram
    if (!formData.telefono.trim() && !formData.instagram.trim()) {
      newErrors.contacto = 'Debe proporcionar al menos un número de teléfono o Instagram';
    }

    // Validaciones de formato
    if (formData.telefono && !validatePhone(formData.telefono)) {
      newErrors.telefono = 'El formato del teléfono no es válido';
    }

    if (formData.instagram && !validateInstagram(formData.instagram)) {
      newErrors.instagram = 'El formato del Instagram no es válido (solo letras, números, puntos y guiones bajos, máximo 30 caracteres)';
    }

    if (formData.año_nacimiento && !validateBirthYear(formData.año_nacimiento)) {
      newErrors.año_nacimiento = 'El año de nacimiento debe estar entre 1900 y el año actual';
    }

    // Validación de duplicados
    const duplicates = checkDuplicates(
      formData.telefono || undefined,
      formData.instagram || undefined,
      contact?.id
    );

    if (duplicates.telefono) {
      newErrors.telefono = 'Este número de teléfono ya está registrado';
    }

    if (duplicates.instagram) {
      newErrors.instagram = 'Este Instagram ya está registrado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        universidad: formData.universidad,
        universidadId: formData.universidadId,
        titulacion: formData.titulacion,
        titulacionId: formData.titulacionId,
        nombre: formData.nombre,
        curso: formData.curso,
        telefono: formData.telefono || undefined,
        instagram: formData.instagram || undefined,
        año_nacimiento: formData.año_nacimiento || undefined,
        comercial: formData.comercial || undefined,
        dia_libre: formData.dia_libre || undefined
      };
      
      console.log('📝 Submitting contact form:', submitData);
      const result = onSubmit(submitData);
      console.log('✅ Contact form submitted successfully:', result);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Universidad - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad *
            </label>
            <select
              value={formData.universidad}
              onChange={(e) => handleUniversidadChange(e.target.value)}
              disabled={loadingUniversities}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.universidad ? 'border-red-300' : 'border-gray-300'
              } ${loadingUniversities ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {loadingUniversities ? 'Cargando universidades...' : 'Selecciona una universidad'}
              </option>
              {universities.map(uni => (
                <option key={uni._id} value={uni.nombre}>{uni.nombre}</option>
              ))}
            </select>
            {errors.universidad && (
              <p className="text-red-500 text-sm mt-1">{errors.universidad}</p>
            )}
          </div>

          {/* 2. Titulación - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulación *
            </label>
            <select
              value={formData.titulacion}
              onChange={(e) => handleTitulacionChange(e.target.value)}
              disabled={!formData.universidad}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.titulacion ? 'border-red-300' : 'border-gray-300'
              } ${!formData.universidad ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {!formData.universidad ? 'Primero selecciona una universidad' : 'Selecciona una titulación'}
              </option>
              {availableTitulaciones.map(tit => (
                <option key={tit} value={tit}>{tit}</option>
              ))}
            </select>
            {errors.titulacion && (
              <p className="text-red-500 text-sm mt-1">{errors.titulacion}</p>
            )}
          </div>

          {/* 3. Nombre - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nombre completo del estudiante"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* 4. Curso - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso *
            </label>
            <select
              value={formData.curso || ''}
              onChange={(e) => handleChange('curso', e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.curso ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona el curso</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso}>{curso}º</option>
              ))}
            </select>
            {errors.curso && (
              <p className="text-red-500 text-sm mt-1">{errors.curso}</p>
            )}
          </div>

          {/* Mensaje de error general para contacto */}
          {errors.contacto && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-600 text-sm">{errors.contacto}</p>
            </div>
          )}

          {/* 5. Número de teléfono - Opcional pero al menos uno requerido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de teléfono <span className="text-gray-500 font-normal">(al menos uno requerido)</span>
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.telefono ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 666 123 456"
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* 6. Instagram - Opcional pero al menos uno requerido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram <span className="text-gray-500 font-normal">(al menos uno requerido)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">@</span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                className={`w-full border rounded-md pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.instagram ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="usuario_instagram"
                maxLength={30}
              />
            </div>
            {errors.instagram && (
              <p className="text-red-500 text-sm mt-1">{errors.instagram}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Solo letras, números, puntos y guiones bajos. Máximo 30 caracteres.
            </p>
          </div>

          {/* 7. Año de nacimiento - Opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año de nacimiento <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.año_nacimiento || ''}
              onChange={(e) => handleChange('año_nacimiento', e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.año_nacimiento ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 1995"
            />
            {errors.año_nacimiento && (
              <p className="text-red-500 text-sm mt-1">{errors.año_nacimiento}</p>
            )}
          </div>

          {/* 8. Día libre - Opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día libre <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <select
              value={formData.dia_libre}
              onChange={(e) => handleChange('dia_libre', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Ninguno</option>
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
          </div>

          {/* 9. Comercial - Opcional - Solo visible para administradores */}
          {user?.role?.toLowerCase() === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comercial <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <select
                value={formData.comercial}
                onChange={(e) => handleChange('comercial', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.comercial ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un comercial</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} ({user.email})
                  </option>
                ))}
              </select>
              {errors.comercial && (
                <p className="text-red-500 text-sm mt-1">{errors.comercial}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {contact ? 'Actualizar' : 'Crear'} Contacto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}