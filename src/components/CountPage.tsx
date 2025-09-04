import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, Users, Filter, ArrowRight } from 'lucide-react';
import { Contact, UniversityStats, TitulationStats } from '../types';
import universidadesService, { UniversidadConEstadisticas } from '../services/universidadesService';
import { schoolsMapping, schoolOrder, getSchoolForTitulation } from '../data/schoolsData';
import { User } from '../types/auth';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

interface CountPageProps {
  onNavigateToContacts: (filters: any) => void;
  currentUser: User | null;
}

export default function CountPage({ onNavigateToContacts, currentUser }: CountPageProps) {
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>('');
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [selectedComercial, setSelectedComercial] = useState<string>('');
  const [allUniversidades, setAllUniversidades] = useState<UniversidadConEstadisticas[]>([]);
  const [loadingUniversidades, setLoadingUniversidades] = useState<boolean>(true);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<any>(null);
  const [comerciales, setComerciales] = useState<User[]>([]);
  const [loadingComerciales, setLoadingComerciales] = useState<boolean>(false);

  const { getAllUsers } = useAuth();
  const { getJefeSubordinados } = usePermissions();

  // Agregar logs para debugging
  console.log('🎯 CountPage - Filtros actuales:', { selectedUniversidad, selectedCurso });

  useEffect(() => {
    const fetchAllUniversidades = async () => {
      try {
        console.log('📥 Cargando todas las universidades con estadísticas...');
        const response = await universidadesService.getUniversidadesConEstadisticas('activa');
        console.log('🏫 Universidades con estadísticas cargadas:', response);
        setAllUniversidades(response.universidades);
        setEstadisticasGenerales(response.estadisticasGenerales);
      } catch (error) {
        console.error('❌ Error cargando universidades con estadísticas:', error);
        setAllUniversidades([]);
        setEstadisticasGenerales(null);
      } finally {
        setLoadingUniversidades(false);
      }
    };

    fetchAllUniversidades();
  }, []);

  // Cargar comerciales si el usuario es admin
  useEffect(() => {
    const fetchComerciales = async () => {
      if (currentUser?.role?.toLowerCase() === 'admin') {
        try {
          setLoadingComerciales(true);
          console.log('🔄 Cargando comerciales para admin...');
          const users = await getAllUsers();
          console.log('👥 Usuarios obtenidos:', users);
          const comercialesOnly = users.filter(user => user.role === 'comercial');
          console.log('💼 Comerciales filtrados:', comercialesOnly);
          setComerciales(comercialesOnly);
        } catch (error) {
          console.error('❌ Error cargando comerciales:', error);
          setComerciales([]);
        } finally {
          setLoadingComerciales(false);
        }
      } else {
        console.log('👤 Usuario no es admin, no se cargan comerciales');
        setComerciales([]);
      }
    };

    fetchComerciales();
  }, [currentUser, getAllUsers]);

  // Extraer todos los contactos de la estructura anidada
  const allContacts = useMemo(() => {
    const contacts: Contact[] = [];
    
    allUniversidades.forEach(universidad => {
      universidad.titulaciones.forEach(titulacion => {
        titulacion.cursos.forEach(curso => {
          curso.alumnos.forEach(alumno => {
            contacts.push({
              id: alumno._id,
              nombre: alumno.nombreCompleto,
              telefono: alumno.telefono,
              instagram: alumno.instagram,
              universidad: universidad.nombre,
              universidadId: universidad.id,
              titulacion: titulacion.nombre,
              titulacionId: titulacion._id,
              curso: parseInt(curso.curso),
              año_nacimiento: alumno.anioNacimiento,
              fecha_alta: alumno.fechaAlta,
              comercial_id: alumno.comercialId,
              comercial_nombre: '', // Este campo no está en la estructura actual
              comercial: alumno.comercialId
            });
          });
        });
      });
    });
    
    return contacts;
  }, [allUniversidades]);

  // Función para obtener todos los comerciales visibles (incluyendo subordinados)
  const getComercialVisibles = useMemo(() => {
    if (!selectedComercial) {
      console.log('🚫 No hay comercial seleccionado');
      return [];
    }
    
    // Obtener subordinados del comercial seleccionado
    const subordinados = getJefeSubordinados(selectedComercial);
    const comercialesVisibles = [selectedComercial, ...subordinados];
    
    console.log(`👥 Comerciales visibles para ${selectedComercial}:`, comercialesVisibles);
    console.log('🔍 Subordinados encontrados:', subordinados);
    return comercialesVisibles;
  }, [selectedComercial, getJefeSubordinados]);

  const filteredContacts = useMemo(() => {
    console.log('🎯 Iniciando filtrado de contactos...');
    console.log('📊 Total contactos disponibles:', allContacts.length);
    console.log('🔧 Filtros activos:', { selectedUniversidad, selectedCurso, selectedComercial });
    
    const filtered = allContacts.filter(contact => {
      const matchesUniversidad = !selectedUniversidad || contact.universidad === selectedUniversidad;
      const matchesCurso = !selectedCurso || contact.curso?.toString() === selectedCurso;
      
      // CORRECCIÓN: Usar el valor del useMemo directamente
      let matchesComercial = true;
      if (selectedComercial) {
        console.log(`🔍 Verificando contacto ${contact.nombre} - comercial_id: ${contact.comercial_id}`);
        console.log('👥 Comerciales visibles:', getComercialVisibles);
        matchesComercial = getComercialVisibles.includes(contact.comercial_id);
        console.log(`✅ Coincide comercial: ${matchesComercial}`);
      }
      
      const matches = matchesUniversidad && matchesCurso && matchesComercial;
      console.log(`📋 Contacto ${contact.nombre}: Universidad(${matchesUniversidad}) + Curso(${matchesCurso}) + Comercial(${matchesComercial}) = ${matches}`);
      
      return matches;
    });
    
    console.log('🔍 Contactos filtrados (incluyendo subordinados):', filtered.length, filtered);
    return filtered;
  }, [allContacts, selectedUniversidad, selectedCurso, selectedComercial, getComercialVisibles]);

  // NUEVO: Calcular estadísticas incluyendo TODAS las universidades disponibles
  // Actualizar universityStats
  const universityStats = useMemo(() => {
    const stats: Record<string, UniversityStats> = {};
    
    // Primero, crear entradas para TODAS las universidades disponibles
    allUniversidades.forEach(universidad => {
      stats[universidad.nombre] = {
        universidad: universidad.nombre,
        total: 0,
        titulaciones: []
      };
    });
    
    // Luego, contar contactos que coinciden con los filtros
    allContacts.forEach(contact => {
      if (stats[contact.universidad]) {
        const matchesUniversidad = !selectedUniversidad || contact.universidad === selectedUniversidad;
        const matchesCurso = !selectedCurso || contact.curso?.toString() === selectedCurso;
        
        // MODIFICACIÓN: Incluir contactos de subordinados
        let matchesComercial = true;
        if (selectedComercial) {
          matchesComercial = getComercialVisibles.includes(contact.comercial_id);
        }
        
        if (matchesUniversidad && matchesCurso && matchesComercial) {
          stats[contact.universidad].total++;
        }
      }
    });

    // Devolver TODAS las universidades, incluso las que tienen 0 contactos
    const result = Object.values(stats).sort((a, b) => {
      if (a.total !== b.total) {
        return b.total - a.total; // Ordenar por total descendente
      }
      return a.universidad.localeCompare(b.universidad); // Luego alfabéticamente
    });
    
    console.log('📊 Estadísticas por universidad (incluyendo subordinados):', result);
    return result;
  }, [allUniversidades, allContacts, selectedUniversidad, selectedCurso, selectedComercial, getComercialVisibles]);

  // NUEVO: Calcular estadísticas de titulación incluyendo TODAS las titulaciones disponibles
  const titulationStats = useMemo(() => {
    const stats: Record<string, TitulationStats & { porComercial?: Record<string, number>; school?: string }> = {};
    
    // Crear entradas para TODAS las titulaciones de TODAS las universidades
    allUniversidades.forEach(universidad => {
      universidad.titulaciones.forEach(titulacion => {
        const key = `${universidad.nombre}-${titulacion.nombre}`;
        
        stats[key] = {
          titulacion: titulacion.nombre,
          universidad: universidad.nombre,
          total: 0,
          porCurso: {},
          porComercial: {},
          school: universidad.codigo || 'Sin clasificar'
        };
      });
    });
    
    // Contar contactos que coinciden con los filtros actuales
    allContacts.forEach(contact => {
      const key = `${contact.universidad}-${contact.titulacion}`;
      
      if (stats[key]) {
        const matchesUniversidadFilter = !selectedUniversidad || contact.universidad === selectedUniversidad;
        const matchesCursoFilter = !selectedCurso || contact.curso?.toString() === selectedCurso;
        
        if (matchesUniversidadFilter && matchesCursoFilter) {
          stats[key].total++;
          
          // Contar por curso
          if (contact.curso) {
            stats[key].porCurso[contact.curso] = (stats[key].porCurso[contact.curso] || 0) + 1;
          }
          
          // Contar por comercial
          const comercialNombre = contact.comercial_nombre || 'Sin asignar';
          stats[key].porComercial![comercialNombre] = (stats[key].porComercial![comercialNombre] || 0) + 1;
        }
      }
    });

    const result = Object.values(stats).sort((a, b) => {
      if (a.universidad !== b.universidad) {
        return a.universidad.localeCompare(b.universidad);
      }
      return b.total - a.total;
    });
    
    console.log('🎓 Estadísticas por titulación (incluyendo subordinados):', result);
    return result;
  }, [allUniversidades, allContacts, selectedUniversidad, selectedCurso]);

  const totalContacts = filteredContacts.length;
  const totalUniversidades = estadisticasGenerales?.totalUniversidades || allUniversidades.length;
  const totalTitulaciones = estadisticasGenerales?.totalTitulaciones || allUniversidades.reduce((sum, uni) => sum + uni.titulaciones.length, 0);
  const totalAlumnos = estadisticasGenerales?.totalAlumnos || allContacts.length;
  
  // CORREGIDO: Crear uniqueUniversidades desde allUniversidades
  const uniqueUniversidades = allUniversidades.map(uni => uni.nombre).sort();

  console.log('📈 Totales calculados:', { totalContacts, totalUniversidades, totalTitulaciones });

  const handleUniversityClick = (universidad: string) => {
    onNavigateToContacts({
      universidad,
      titulacion: '',
      curso: selectedCurso,
      aportado_por: '',
      consentimiento: '',
      search: '',
      comercial: selectedComercial
    });
  };

  const handleTitulationClick = (universidad: string, titulacion: string) => {
    onNavigateToContacts({
      universidad,
      titulacion,
      curso: selectedCurso,
      aportado_por: '',
      consentimiento: '',
      search: '',
      comercial: selectedComercial
    });
  };

  const scrollToUniversitySection = (universidad: string) => {
    // Usar el mismo formato de ID que se usa en la sección de titulaciones
    const universidadId = universidad.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const targetElement = document.getElementById(`universidad-${universidadId}`);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      setTimeout(() => {
        const yOffset = -20;
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 100);
    } else {
      console.log('No se encontró el elemento con ID:', `universidad-${universidadId}`);
    }
  };

  const handleUniversityCardClick = (universidad: string) => {
    scrollToUniversitySection(universidad);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteo y Estadísticas</h1>
          <p className="text-gray-600">Resumen de contactos por universidad y titulación</p>
        </div>
      </div>

      {/* Filtros de contexto */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtros de Contexto</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <select
              value={selectedUniversidad}
              onChange={(e) => setSelectedUniversidad(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loadingUniversidades}
            >
              <option value="">{loadingUniversidades ? 'Cargando universidades...' : 'Todas las universidades'}</option>
              {!loadingUniversidades && uniqueUniversidades.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los cursos</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso.toString()}>{curso}º</option>
              ))}
            </select>
          </div>

          {/* Filtro de comerciales - Solo visible para admin */}
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comercial
              </label>
              <select
                value={selectedComercial}
                onChange={(e) => setSelectedComercial(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingComerciales}
              >
                <option value="">{loadingComerciales ? 'Cargando comerciales...' : 'Todos los comerciales'}</option>
                {!loadingComerciales && comerciales.map(comercial => (
                  <option key={comercial.id} value={comercial.id}>{comercial.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Resumen general */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Total de Contactos</h3>
              <p className="text-2xl font-bold">{totalContacts}</p>
            </div>
            <Users className="w-8 h-8 opacity-75" />
          </div>
          
          <div>
            <h3 className="text-sm font-medium opacity-90">Universidades</h3>
            <p className="text-2xl font-bold">{totalUniversidades}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-90">Titulaciones</h3>
            <p className="text-2xl font-bold">{totalTitulaciones}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium opacity-90">Total Alumnos</h3>
            <p className="text-2xl font-bold">{totalAlumnos}</p>
          </div>
        </div>
      </div>

      {/* Contactos por Universidad */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contactos por Universidad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universityStats.map(stat => {
            const percentage = totalContacts > 0 ? ((stat.total / totalContacts) * 100).toFixed(1) : '0';
            return (
              <div
                key={stat.universidad}
                onClick={() => handleUniversityCardClick(stat.universidad)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{stat.universidad}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mb-1">{stat.total}</p>
                <p className="text-sm text-gray-500">{percentage}% del total</p>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contactos por Titulación */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Contactos por Titulación
          {selectedUniversidad && (
            <span className="text-blue-600 font-normal"> - {selectedUniversidad}</span>
          )}
        </h2>
        
        {/* Agrupar por universidad */}
        {[...new Set(titulationStats.map(stat => stat.universidad))]
          .sort()
          .map(universidad => {
            const universidadData = allUniversidades.find(u => u.nombre === universidad);
            
            // Filtrar por universidad seleccionada si existe
            if (selectedUniversidad && universidad !== selectedUniversidad) {
              return null;
            }
            
            const titulacionesUniversidad = universidadData?.titulaciones || [];
            // Crear ID único para la universidad
            const universidadId = universidad.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            // Obtener el código de la universidad para buscar en schoolsMapping
            const universidadCodigo = Object.keys(schoolsMapping).find(codigo => {
              // Si el nombre de la universidad ya es una abreviación, usarla directamente
              if (Object.keys(schoolsMapping).includes(universidad)) {
                return codigo === universidad;
              }
              
              // Si no, buscar por nombre completo (para compatibilidad)
              const nombreCompleto = {
                'UV': 'Universidad de Valencia',
                'UPV': 'Universidad Politécnica de Valencia', 
                'CEU': 'Universidad CEU Cardenal Herrera',
                'UCV': 'Universidad Católica de Valencia',
                'EDEM': 'EDEM Escuela de Empresarios',
                'ESIC': 'ESIC Business & Marketing School',
                'FLORIDA': 'Florida Universitaria',
                'UEV': 'Universidad Europea des Valencia',
                'EASD': 'Escuela de Arte y Superior de Diseño'
              }[codigo];
              return nombreCompleto === universidad;
            }) || universidad; // Si no encuentra coincidencia, usar el nombre tal como viene
            
            // Agrupar titulaciones por rama/escuela
            const titulacionesPorRama: Record<string, any[]> = {};
            
            titulacionesUniversidad.forEach(titulacion => {
              const rama = getSchoolForTitulation(universidadCodigo || '', titulacion.nombre) || 'Sin clasificar';
              if (!titulacionesPorRama[rama]) {
                titulacionesPorRama[rama] = [];
              }
              titulacionesPorRama[rama].push(titulacion);
            });
            
            // Obtener el orden de las ramas para esta universidad
            const ordenRamas = universidadCodigo ? (schoolOrder[universidadCodigo as keyof typeof schoolOrder] || []) : [];
            const ramasOrdenadas = ordenRamas.filter(rama => titulacionesPorRama[rama]);
            
            // Agregar ramas que no están en el orden definido
            Object.keys(titulacionesPorRama).forEach(rama => {
              if (!ramasOrdenadas.includes(rama)) {
                ramasOrdenadas.push(rama);
              }
            });
            
            return (
              <div key={universidad} id={`universidad-${universidadId}`} className="mb-8 scroll-mt-6">
                {/* Header de Universidad */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-t-lg px-6 py-4">
                  <h3 className="text-lg font-bold text-white">{universidad}</h3>
                  <p className="text-blue-100 text-sm">
                    {titulacionesUniversidad.length} titulaciones disponibles en {ramasOrdenadas.length} ramas
                  </p>
                </div>
                
                {/* Contenido agrupado por ramas */}
                <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden">
                  {ramasOrdenadas.map((rama, ramaIndex) => {
                    const titulacionesRama = titulacionesPorRama[rama] || [];
                    
                    return (
                      <div key={rama} className={ramaIndex > 0 ? 'border-t border-gray-300' : ''}>
                        {/* Header de la rama */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 border-b border-blue-200">
                          <h4 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">
                            {rama}
                          </h4>
                          <p className="text-xs text-blue-600 mt-1">
                            {titulacionesRama.length} titulaciones
                          </p>
                        </div>
                        
                        {/* Header de la tabla */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-2 border-b border-gray-200">
                          <div className="grid grid-cols-12 gap-4 text-gray-700 text-sm font-medium">
                            <div className="col-span-3">TITULACIÓN</div>
                            <div className="col-span-1 text-center">TOTAL</div>
                            <div className="col-span-1 text-center">1º</div>
                            <div className="col-span-1 text-center">2º</div>
                            <div className="col-span-1 text-center">3º</div>
                            <div className="col-span-1 text-center">4º</div>
                            <div className="col-span-1 text-center">5º</div>
                            <div className="col-span-1 text-center">6º</div>
                            <div className="col-span-1">COMERCIALES</div>
                            <div className="col-span-1 text-center">CONTACTOS</div>
                          </div>
                        </div>
                        
                        {/* Filas de titulaciones de esta rama */}
                        <div className="divide-y divide-gray-100">
                          {titulacionesRama.map((titulacion, index) => {
                            const totalAlumnosTitulacion = titulacion.totalAlumnos || 0;
                            
                            // Calcular alumnos por curso
                            const alumnosPorCurso: Record<number, number> = {};
                            titulacion.cursos?.forEach(curso => {
                              alumnosPorCurso[parseInt(curso.curso)] = curso.totalAlumnos || 0;
                            });
                            
                            // Calcular comerciales por titulación
                            const comercialesPorTitulacion: Record<string, number> = {};
                            titulacion.cursos?.forEach(curso => {
                              if (curso.alumnos && Array.isArray(curso.alumnos)) {
                                curso.alumnos.forEach(alumno => {
                                  const nombreComercial = alumno.comercialNombre || 'Sin asignar';
                                  comercialesPorTitulacion[nombreComercial] = (comercialesPorTitulacion[nombreComercial] || 0) + 1;
                                });
                              }
                            });
                            
                            return (
                              <div key={`${universidad}-${rama}-${titulacion.nombre}`} className="px-6 py-3 hover:bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                  {/* Nombre de la titulación */}
                                  <div className="col-span-3">
                                    <span className="font-medium text-gray-900 text-sm">{titulacion.nombre}</span>
                                  </div>
                                  
                                  {/* Total */}
                                  <div className="col-span-1 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                      {totalAlumnosTitulacion}
                                    </span>
                                  </div>
                                  
                                  {/* Cursos 1º a 6º */}
                                  {[1, 2, 3, 4, 5, 6].map(curso => (
                                    <div key={curso} className="col-span-1 text-center">
                                      {alumnosPorCurso[curso] ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {alumnosPorCurso[curso]}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">0</span>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* Comerciales */}
                                  <div className="col-span-1">
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(comercialesPorTitulacion).length > 0 ? (
                                        Object.entries(comercialesPorTitulacion)
                                          .sort(([,a], [,b]) => b - a)
                                          .map(([nombre, cantidad]) => (
                                            <span key={nombre} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                              {nombre}: {cantidad}
                                            </span>
                                          ))
                                      ) : (
                                        <span className="text-gray-400 text-xs">Sin comerciales</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Nueva columna de Contactos */}
                                  <div className="col-span-1 text-center">
                                    <button
                                      onClick={() => handleTitulationClick(universidad, titulacion.nombre)}
                                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                      Ver contactos
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
          .filter(Boolean)}

        {titulationStats.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos para mostrar con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
