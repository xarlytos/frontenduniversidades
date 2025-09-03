const mongoose = require('mongoose');

// URI de tu base de datos
const MONGODB_URI = 'mongodb://localhost:27017/university_management';

async function migrateDiaLibre() {
  try {
    console.log('Conectando a:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Actualizar todos los contactos que no tienen diaLibre
    const result = await mongoose.connection.db.collection('contactos').updateMany(
      { diaLibre: { $exists: false } }, // Contactos sin el campo diaLibre
      { $set: { diaLibre: null } }      // Establecer como null (opcional)
    );

    console.log(`✅ Migración completada:`);
    console.log(`   - Contactos actualizados: ${result.modifiedCount}`);
    console.log(`   - Contactos encontrados: ${result.matchedCount}`);

    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrateDiaLibre();