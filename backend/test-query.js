const mongoose = require('mongoose');

async function testQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/proyecto-garrote');
    console.log('✅ Conectado a MongoDB');
    
    const Permiso = mongoose.model('Permiso', new mongoose.Schema({
      clave: String,
      descripcion: String
    }, { timestamps: true }));
    
    const claves = ['VER_CONTACTOS', 'CREAR_CONTACTOS', 'EDITAR_CONTACTOS', 'ELIMINAR_CONTACTOS'];
    console.log('🔍 Buscando permisos con claves:', claves);
    
    const permisos = await Permiso.find({ clave: { $in: claves } });
    console.log('📋 Permisos encontrados:', permisos.length);
    
    permisos.forEach(p => {
      console.log(`- ID: ${p._id} | Clave: ${p.clave} | Descripción: ${p.descripcion}`);
    });
    
    if (permisos.length === 0) {
      console.log('\n🔍 Verificando todos los permisos en la base de datos:');
      const todosPermisos = await Permiso.find({});
      console.log('Total de permisos:', todosPermisos.length);
      todosPermisos.forEach(p => {
        console.log(`- ${p.clave}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

testQuery();