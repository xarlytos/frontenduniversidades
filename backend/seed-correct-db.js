const mongoose = require('mongoose');

// URI correcta que usa el controlador
const MONGODB_URI = 'mongodb://localhost:27017/university_management';

async function seedDatabase() {
  try {
    console.log('Conectando a:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Definir esquemas
    const permisoSchema = new mongoose.Schema({
      clave: { type: String, required: true, unique: true },
      descripcion: { type: String, required: true }
    }, { timestamps: true });

    const usuarioSchema = new mongoose.Schema({
      nombre: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      rol: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
      activo: { type: Boolean, default: true }
    }, { timestamps: true });

    const Permiso = mongoose.model('Permiso', permisoSchema);
    const Usuario = mongoose.model('Usuario', usuarioSchema);

    // Crear permisos básicos
    const permisosBasicos = [
      { clave: 'VER_CONTACTOS', descripcion: 'Ver contactos' },
      { clave: 'CREAR_CONTACTOS', descripcion: 'Crear contactos' },
      { clave: 'EDITAR_CONTACTOS', descripcion: 'Editar contactos' },
      { clave: 'ELIMINAR_CONTACTOS', descripcion: 'Eliminar contactos' },
      { clave: 'VER_USUARIOS', descripcion: 'Ver usuarios' },
      { clave: 'CREAR_USUARIOS', descripcion: 'Crear usuarios' },
      { clave: 'EDITAR_USUARIOS', descripcion: 'Editar usuarios' },
      { clave: 'ELIMINAR_USUARIOS', descripcion: 'Eliminar usuarios' },
      { clave: 'GESTIONAR_PERMISOS', descripcion: 'Gestionar permisos de usuarios' }
    ];

    console.log('Creando permisos...');
    for (const permisoData of permisosBasicos) {
      const existePermiso = await Permiso.findOne({ clave: permisoData.clave });
      if (!existePermiso) {
        const permiso = new Permiso(permisoData);
        await permiso.save();
        console.log(`✅ Permiso creado: ${permisoData.clave}`);
      } else {
        console.log(`⚠️  Permiso ya existe: ${permisoData.clave}`);
      }
    }

    // Verificar permisos creados
    const totalPermisos = await Permiso.countDocuments();
    console.log(`\n📊 Total de permisos en la base de datos: ${totalPermisos}`);

    const permisos = await Permiso.find({}).limit(5);
    console.log('\n🔍 Primeros 5 permisos:');
    permisos.forEach(p => {
      console.log(`  - ${p._id}: ${p.clave} (${p.descripcion})`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Seed completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seedDatabase();