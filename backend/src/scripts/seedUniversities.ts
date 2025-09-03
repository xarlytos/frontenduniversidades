import mongoose from 'mongoose';
import { config } from '../config/environment';
import { Universidad } from '../models/Universidad';
import { Titulacion } from '../models/Titulacion';
import { Usuario } from '../models/Usuario';

// University data from frontend
const universitiesData = {
  "UV": {
    nombre: "Universidad de Valencia",
    titulaciones: [
      "CIENCIA DE DATOS",
      "ING. ELECTRONICA DE TELECOMUNICACION",
      "ING. ELECTRONICA INDUSTRIAL",
      "ING. INFORMATICA",
      "ING. MULTIMEDIA",
      "ING. QUIMICA",
      "ING. TELEMATICA",
      "CIENCIA Y TECNOLOGIA DE LOS ALIMENTOS",
      "ENFERMERIA LA FE",
      "ENFERMERIA BLASCO",
      "FARMACIA",
      "FISIOTERAPIA",
      "LOGOPEDIA",
      "MEDICINA",
      "NUTRICION HUMANA Y DIETETICA",
      "ODONTOLOGIA",
      "OPTICA Y OPTOMETRIA",
      "PODOLOGIA",
      "PSICOLOGIA",
      "ADE",
      "CAFD",
      "CIENCIAS POLITICAS",
      "COMUNICACION AUDIOVISUAL",
      "CRIMINOLOGIA",
      "DERECHO",
      "ECONOMIA",
      "EDUCACION SOCIAL",
      "FINANZAS Y CONTABILIDAD",
      "GEOGRAFIA Y MEDIO AMBIENTE",
      "INFORMACION Y DOCUMENTACION",
      "INTELIGENCIA Y ANALITICA DE NEGOCIOS",
      "INTERNATIONAL BUSINESS",
      "BIA",
      "EDUCACION INFANTIL",
      "EDUCACION PRIMARIA",
      "EDUCACION PRIMARIA (ONTINYENT)",
      "PEDAGOGIA",
      "PERIODISMO",
      "RRLL / RRHH",
      "SOCIOLOGIA",
      "TRABAJO SOCIAL",
      "TURISMO",
      "ESTUDIOS HISPANICOS",
      "ESTUDIOS INGLESES",
      "FILOLOGIA CATALANA",
      "FILOSOFIA",
      "HISTORIA",
      "HISTORIA DEL ARTE",
      "LENGUAS MODERNAS",
      "TRADUCCION ALEMAN",
      "TRADUCCION FRANCES",
      "TRADUCCION INGLES",
      "FILOSOFIA CLASICA",
      "ADE + DERECHO (DADE)",
      "DERECHO Y CRIMINOLOGIA",
      "DERECHO Y ECONOMIA",
      "DERECHO Y CIENCIAS POLITICAS",
      "FARMACIA Y NUTRICION",
      "FARMACIA Y MATEMATICAS",
      "QUIMICA E ING. QUIMICA",
      "TURISMO Y ADE",
      "FISICA Y QUIMICA",
      "BIOLOGIA",
      "BIOLOGIA Y CIENCIAS BIOMEDICAS",
      "BIOTECNOLOGIA",
      "CIENCIAS AMBIENTALES",
      "CIENCIAS GASTRONOMICAS",
      "FISICA",
      "MATEMATICAS",
      "QUIMICA"
    ]
  },
  "UPV": {
    nombre: "Universidad Politécnica de Valencia",
    titulaciones: [
      "ING. BIOMEDICA",
      "ING. ORGANIZACION INDUSTRIAL",
      "ING. TECNOLOGIAS INDUSTRIALES",
      "ING. QUIMICA",
      "ING. DE LAS ENERGIAS",
      "CIENCIA DE DATOS",
      "INFORMATICA INDUSTRIAL Y ROBOTICA",
      "ING. INFORMATICA",
      "ADE + ING. INFORMATICA",
      "MATEMATICAS + ING. INFORMATICA",
      "ING. FISICA",
      "ING. TECNOLOGIAS Y SERVICIOS DE TELECO",
      "TECNOLOGIA DIGITAL Y MULTUMEDIA",
      "ADE + TELECO",
      "MATEMATICAS + ADE",
      "MATEMATICAS + ING. CIVIL",
      "MATEMATICAS + TELECO",
      "GESTION DE TRANSPORTE Y LOGISTICA",
      "ING. CIVIL",
      "ING. OBRAS PUBLICAS",
      "BIOTECNOLOGIA",
      "CIENCIA Y TECNOLOGIA DE LOS ALIMENTOS",
      "ING. AGROALIMENTARIA Y DEL MEDIO RURAL",
      "ING. FORESTAL Y DEL MEDIO NATURAL",
      "ADE + CIENCIA Y TECNOLOGIA DE LOS ALIMENTOS",
      "BIOTEC + ING. AGROALIMENTARIA Y DEL MEDIO RURAL",
      "ING. AGROALIMENTARIA + CIENCIA Y TECNOLOGIA ALIMENTOS",
      "ING. FORESTAL + CIENCIAS AMBIENTALES",
      "ING. AEROESPACIAL",
      "ING. DISEÑO INDUSTRIAL Y DESARROLLO DE PRODUCTOS",
      "ING. DISEÑO INDUSTRIAL Y DESARROLLO DE PRODUCTOS (ALCOY)",
      "ING. ELECTRICA",
      "ING. ELECTRONICA INDUSTRIAL Y AUTOMATICA",
      "ING. MECANICA",
      "ARQUITECTURA TECNICA",
      "FUNDAMENTOS DE LA ARQUITECTURA",
      "DISEÑO ARQUITECTONICO DE INTERIORES",
      "ING. GEOMATICA Y TOPOGRAFICA",
      "ADE",
      "GESTION Y ADMINISTRACION PUBLICA",
      "ADE + ING INFORMATICA",
      "BELLAS ARTES",
      "CONSERVACION Y RESTAURACION DE BIENES CULTURALES",
      "DISEÑO Y TECNOLOGIAS CREATIVAS"
    ]
  },
  "CEU": {
    nombre: "Universidad CEU Cardenal Herrera",
    titulaciones: [
      "MEDICINA",
      "ODONTOLOGIA",
      "ENFERMERIA",
      "FISIOTERAPIA",
      "FARMACIA",
      "OPTICA Y OPTOMETRIA",
      "NUTRICION",
      "COMUNICACION AUDIOVISUAL",
      "PERIODISMO",
      "PUBLICIDAD Y RRPP",
      "EDUCACION INFANTIL",
      "EDUCACION PRIMARIA",
      "EDUCACION INFANTIL + PRIMARIA",
      "ARQUITECTURA",
      "DISEÑO INDUSTRIAL",
      "DERECHO",
      "CIENCIAS POLITICAS",
      "VETERINARIA",
      "ADE",
      "MARKETING",
      "ADE + MARKETING",
      "COMUNICIÓN AUDIOVISUAL Y MODA",
      "GASTRONOMIA"
    ]
  },
  "UCV": {
    nombre: "Universidad Católica de Valencia",
    titulaciones: [
      "FISIOTERAPIA",
      "FISIOTERAPIA EN INGLES",
      "PODOLOGIA",
      "PODOLOGIA + ENFERMERIA",
      "PODOLOGIA + FISIOTERAPIA",
      "ENFERMERIA",
      "ENFERMERIA (ALZIRA)",
      "MEDICINA",
      "NUTRICION",
      "NUTRICION + ENFERMERIA",
      "ODONTOLOGIA",
      "ODONTOLOGIA EN INGLES",
      "CAFD",
      "CAFD + FISIOTERAPIA",
      "CAFD + NUTRICION",
      "BIOTECNOLOGIA",
      "CIENCIAS DEL MAR",
      "VETERINARIA",
      "CIENCIAS DEL MAR + BIOTECNOLOGIA",
      "CRIMINOLOGIA",
      "DERECHO",
      "DERECHO + ADE",
      "DERECHO + ADE BILINGÜE",
      "DERECHO + CRIMINOLOGIA",
      "ADE",
      "ADE BILINGÜE",
      "ECONOMIA (a distancia)",
      "GESTION ECONOMICO FINANCIERA (a distancia)",
      "ADE + ECONOMIA (a distancia)",
      "DISEÑO Y NARRACION DE ANIMACION Y VIDEOJUEGOS",
      "MULTIMEDIA Y ARTES DIGITALES",
      "EDUCACIÓN INFANTIL",
      "EDUCACIÓN PRIMARIA",
      "EDUCACIÓN PRIMARIA (ALZIRA)",
      "EDUCACIÓN SOCIAL",
      "PEDAGOGÍA",
      "EDUCACION INFANTIL + PRIMARIA",
      "EDUCACION INFANTIL + PRIMARIA (ALZIRA)",
      "EDUCACION INFANTIL + PRIMARIA PIMM",
      "EDUCACION INFANTIL + PEDAGOGIA",
      "EDUCACION PRIMARIA + CAFD",
      "EDUACION PRIMARIA + PEDAGOGIA",
      "EDUCACION SOCIAL + M.E. PRIMARIA",
      "PSICOLOGIA",
      "LOGOPEDIA",
      "PSICOLOGIA (a distancia)",
      "TERAPIA OCUPACIONAL",
      "LOGOPEDIA + EDUCACION PRIMARIA (online)",
      "LOGOPEDIA + PSICOLOGIA",
      "TERAPIA OCUPACIONAL + ENFERMERIA"
    ]
  },
  "EDEM": {
    nombre: "EDEM Escuela de Empresarios",
    titulaciones: [
      "ADE",
      "IGE"
    ]
  },
  "ESIC": {
    nombre: "ESIC Business & Marketing School",
    titulaciones: [
      "DIRECCION Y MANAGEMENT",
      "MARKETING",
      "DIGITAL BUSINESS",
      "COMUNICACION Y PUBLICIDAD / RRPP",
      "INTERNATIONAL BUSINESS"
    ]
  },
  "FLORIDA": {
    nombre: "Florida Universitaria",
    titulaciones: [
      "ING. ELECTRONICA INDUSTRIAL Y AUTOMATICA",
      "ING. MECANICA",
      "MECANICA + INDUSTRIAL Y AUTOMATICA",
      "EDUCACION INFANTIL",
      "EDUACION PRIMARIA",
      "EDUACION INFANTIL + PRIMARIA",
      "ADE",
      "LIDERAZGO EMPRENDEDOR E INNOVACION (LEINN)"
    ]
  },
  "UEV": {
    nombre: "Universidad Europea de Valencia",
    titulaciones: [
      "ADE",
      "ADE + MARKETING",
      "BIOTECNOLOGIA",
      "BUSINESS MANAGEMENT",
      "CIENCIA DE DATOS",
      "CRIMINOLOGIA",
      "CRIMINOLOGIA + DERECHO",
      "CRIMINOLOGIA + PSICOLOGIA",
      "DERECHO",
      "DERECHO Y RELACIONES INTERNACIONALES",
      "ENFERMERIA",
      "FISIOTERAPIA",
      "FISICA",
      "ING. ORGANIZACION INDUSTRIAL",
      "ING. ORGANIZACION INDUSTRIAL + ADE",
      "INTERNATIONAL RELATIONS",
      "MARKETING",
      "ODONTOLOGIA",
      "PSICOLOGIA",
      "TOURISM + LEISURE MANAGEMENT",
      "TRADUCCION Y COMUNICACION INTERCULTURAL"
    ]
  },
  "EASD": {
    nombre: "Escuela de Arte y Superior de Diseño",
    titulaciones: [
      "DISEÑO GRAFICO",
      "DISEÑO DE MODA",
      "DISEÑO DE INTERIORES",
      "DISEÑO DE PRODUCTO",
      "DISEÑO DE PRODUCTO, ITINERARIO DE JOYERIA Y OBJETO",
      "FOTOGRAFIA Y CREACION AUDIOVISUAL",
      "DISEÑO GRAFICO, ITINERARIO DE ILUSTRACION"
    ]
  }
};

// Helper function to generate a simple codigo from nombre
function generateCodigo(nombre: string, index: number): string {
  // Take first 3 letters and add index
  const prefix = nombre.replace(/[^A-Z]/g, '').substring(0, 3);
  return `${prefix}${String(index).padStart(3, '0')}`;
}

async function seedUniversities() {
  try {
    // Connect to database
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const adminUser = await Usuario.findOne({ email: 'admin@university.com' });
    if (!adminUser) {
      console.error('❌ Admin user not found. Please run the initial seeding first.');
      return;
    }
    console.log('✅ Found admin user:', adminUser.email);

    // Clear existing data
    await Titulacion.deleteMany({});
    await Universidad.deleteMany({});
    console.log('🗑️ Cleared existing universities and degrees');

    // Seed universities and degrees
    for (const [codigo, data] of Object.entries(universitiesData)) {
      // Create university
      const universidad = new Universidad({
        codigo,
        nombre: data.nombre,
        estado: 'activa', // Correct enum value
        creadoPor: adminUser._id // Required field
      });
      await universidad.save();
      console.log(`✅ Created university: ${codigo} - ${data.nombre}`);

      // Create degrees for this university
      for (let i = 0; i < data.titulaciones.length; i++) {
        const nombreTitulacion = data.titulaciones[i];
        const titulacion = new Titulacion({
          nombre: nombreTitulacion,
          codigo: generateCodigo(nombreTitulacion, i + 1), // Required field
          tipo: 'grado', // Required field with default value
          universidadId: universidad._id,
          estado: 'activa', // Correct enum value
          creadoPor: adminUser._id, // Required field
          orden: i + 1
        });
        await titulacion.save();
      }
      console.log(`✅ Created ${data.titulaciones.length} degrees for ${codigo}`);
    }

    console.log('🎉 University seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding universities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seeding
seedUniversities();