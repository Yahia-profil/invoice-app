import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@invoice.com' },
    update: {},
    create: {
      email: 'admin@invoice.com', password: adminPassword, nom: 'Admin', role: 'admin',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@invoice.com' },
    update: {},
    create: {
      email: 'user@invoice.com', password: userPassword, nom: 'User Standard', role: 'user',
    },
  });

  await prisma.category.upsert({
    where: { id: 1 }, update: { nom: 'Informatique', tva: 20 },
    create: { id: 1, nom: 'Informatique', tva: 20 },
  });
  await prisma.category.upsert({
    where: { id: 2 }, update: { nom: 'Services', tva: 10 },
    create: { id: 2, nom: 'Services', tva: 10 },
  });
  await prisma.category.upsert({
    where: { id: 3 }, update: { nom: 'Formation', tva: 0 },
    create: { id: 3, nom: 'Formation', tva: 0 },
  });

  const articles = [
    { id: 1, designation: 'Ordinateur Portable', prix_unitaire: 5000, categorie_id: 1 },
    { id: 2, designation: 'Souris sans fil', prix_unitaire: 25, categorie_id: 1 },
    { id: 3, designation: 'Clavier mécanique', prix_unitaire: 80, categorie_id: 1 },
    { id: 4, designation: 'Consultation technique', prix_unitaire: 150, categorie_id: 2 },
    { id: 5, designation: 'Formation React JS', prix_unitaire: 800, categorie_id: 3 },
  ];
  for (const a of articles) {
    await prisma.article.upsert({ where: { id: a.id }, update: a, create: a });
  }

  console.log('Seed completed');
  console.log('Admin: admin@invoice.com / admin123');
  console.log('User:  user@invoice.com / user123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
