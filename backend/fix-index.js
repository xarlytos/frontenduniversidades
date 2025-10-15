const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university_management');
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    
    // Intentar eliminar el índice username_1 si existe
    try {
      await db.collection('usuarios').dropIndex('username_1');
      console.log('✅ Índice username_1 eliminado exitosamente');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ El índice username_1 no existe (esto es normal)');
      } else {
        console.log('❌ Error eliminando índice:', error.message);
      }
    }
    
    // Mostrar índices actuales
    const indexes = await db.collection('usuarios').indexes();
    console.log('📋 Índices actuales en la colección usuarios:');
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.name);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

fixIndex();