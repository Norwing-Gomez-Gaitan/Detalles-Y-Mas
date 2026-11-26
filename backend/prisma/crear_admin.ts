import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'left4deadchele@gmail.com';
  const password = 'Hola1212';
  const nombre = 'Administrador Principal';

  console.log(`🔐 Creando / actualizando administrador: ${email}...`);

  const password_hash = await bcrypt.hash(password, 10);

  const admin = await prisma.usuarioAdmin.upsert({
    where: { email },
    update: {
      password_hash,
      activo: true,
      nombre,
    },
    create: {
      nombre,
      email,
      password_hash,
      activo: true,
    },
  });

  console.log(`✅ Administrador listo:`);
  console.log(`- ID: ${admin.id}`);
  console.log(`- Nombre: ${admin.nombre}`);
  console.log(`- Email: ${admin.email}`);
  console.log(`- Contraseña configurada: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error al crear administrador:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
