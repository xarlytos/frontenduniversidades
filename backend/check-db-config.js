const mongoose = require('mongoose');

// URI que usa el controlador (desde environment.ts)
const controllerURI = 'mongodb://localhost:27017/university_management';

// URI que usé en scripts anteriores
const scriptURI = 'mongodb://localhost:27017/contactos';

async function checkBothDatabases() {
  console.log('=== Verificando base de datos del controlador ===');
  console.log('URI:', controllerURI);
  
  try {
    await mongoose.connect(controllerURI);
    
    const PermisoSchema = new mongoose.Schema({
      clave: String,
      descripcion: String
    });
    
    const Permiso = mongoose.model('Permiso', PermisoSchema);
    
    const permisos = await Permiso.find({});
    console.log(`Permisos encontrados en university_management: ${permisos.length}`);
    
    if (permisos.length > 0) {
      console.log('Primeros 3 permisos:');
      permisos.slice(0, 3).forEach(p => {
        console.log(`  - ${p._id}: ${p.clave} (${p.descripcion})`);
      });
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error con university_management:', error.message);
  }
  
  console.log('\n=== Verificando base de datos de scripts anteriores ===');
  console.log('URI:', scriptURI);
  
  try {
    await mongoose.connect(scriptURI);
    
    const PermisoSchema = new mongoose.Schema({
      clave: String,
      descripcion: String
    });
    
    const Permiso = mongoose.model('Permiso', PermisoSchema);
    
    const permisos = await Permiso.find({});
    console.log(`Permisos encontrados en contactos: ${permisos.length}`);
    
    if (permisos.length > 0) {
      console.log('Primeros 3 permisos:');
      permisos.slice(0, 3).forEach(p => {
        console.log(`  - ${p._id}: ${p.clave} (${p.descripcion})`);
      });
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error con contactos:', error.message);
  }
  
  process.exit(0);
}

checkBothDatabases();