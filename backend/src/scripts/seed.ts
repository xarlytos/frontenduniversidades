import mongoose from 'mongoose';
import { Permiso } from '../models/Permiso';
import { Usuario, RolUsuario } from '../models/Usuario';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Conectar a la base de datos
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/proyecto-garrote';
    console.log('🔗 Conectando a:', mongoUri.substring(0, 20) + '...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Permisos básicos del sistema
const permisosBasicos = [
  {
    clave: 'VER_CONTACTOS',
    descripcion: 'Permite ver contactos'
  },
  {
    clave: 'CREAR_CONTACTOS',
    descripcion: 'Permite crear nuevos contactos'
  },
  {
    clave: 'EDITAR_CONTACTOS',
    descripcion: 'Permite editar contactos existentes'
  },
  {
    clave: 'ELIMINAR_CONTACTOS',
    descripcion: 'Permite eliminar contactos'
  },
  {
    clave: 'IMPORTAR_CONTACTOS',
    descripcion: 'Permite importar contactos desde Excel'
  },
  {
    clave: 'EXPORTAR_CONTACTOS',
    descripcion: 'Permite exportar contactos'
  },
  {
    clave: 'GESTIONAR_USUARIOS',
    descripcion: 'Permite gestionar usuarios del sistema'
  },
  {
    clave: 'VER_ESTADISTICAS',
    descripcion: 'Permite ver estadísticas del sistema'
  },
  {
    clave: 'GESTIONAR_UNIVERSIDADES',
    descripcion: 'Permite gestionar universidades y titulaciones'
  }
];

async function seedPermisos() {
  try {
    console.log('🌱 Seeding permissions...');
    
    // Verificar si ya existen permisos
    const existingPermisos = await Permiso.countDocuments();
    if (existingPermisos > 0) {
      console.log('ℹ️ Permissions already exist, skipping...');
      return;
    }

    // Crear permisos básicos
    for (const permiso of permisosBasicos) {
      const existingPermiso = await Permiso.findOne({ clave: permiso.clave });
      if (!existingPermiso) {
        await Permiso.create(permiso);
        console.log(`✅ Created permission: ${permiso.clave}`);
      }
    }

    console.log('🎉 Permissions seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
  }
}

async function seedAdminUser() {
  try {
    console.log('👤 Seeding admin user...');
    
    // Verificar si ya existe un usuario admin
    const existingAdmin = await Usuario.findOne({ rol: RolUsuario.ADMIN });
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists, skipping...');
      return;
    }

    // Crear usuario administrador por defecto
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@garrote.com',
      passwordHash: hashedPassword,
      rol: RolUsuario.ADMIN,
      estado: 'ACTIVO'
    });

    console.log('✅ Admin user created:', adminUser.email);
    console.log('🔑 Default password: admin123');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await seedPermisos();
    await seedAdminUser();
    
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in seeding process:', error);
    process.exit(1);
  }
}

// Ejecutar el seeding
if (require.main === module) {
  main();
}

export { seedPermisos, seedAdminUser };