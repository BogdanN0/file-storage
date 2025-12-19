import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create test user
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$YourHashedPasswordHere', // This should be properly hashed in production
    },
  });

  console.log('Created user:', user.email);

  // Create root folder
  const rootFolder = await prisma.folder.create({
    data: {
      name: 'Root Folder',
      description: 'Main root folder',
      ownerId: user.id,
    },
  });

  console.log('Created folder:', rootFolder.name);

  // Create subfolder
  const subFolder = await prisma.folder.create({
    data: {
      name: 'Documents',
      description: 'Documents folder',
      ownerId: user.id,
      parentId: rootFolder.id,
    },
  });

  console.log('Created subfolder:', subFolder.name);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
