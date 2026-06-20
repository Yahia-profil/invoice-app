import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data in correct order (foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.invoiceArticle.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteArticle.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // ── USERS ──
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@invoice.com', password: adminPassword, nom: 'Admin', role: 'admin' },
  });

  const user = await prisma.user.create({
    data: { email: 'user@invoice.com', password: userPassword, nom: 'Jean Dupont', role: 'user' },
  });

  // ── CATEGORIES ──
  const catInfo = await prisma.category.create({ data: { id: 1, nom: 'Informatique', tva: 20 } });
  const catServices = await prisma.category.create({ data: { id: 2, nom: 'Services', tva: 10 } });
  const catFormation = await prisma.category.create({ data: { id: 3, nom: 'Formation', tva: 0 } });

  // ── ARTICLES ──
  const articles = [
    { id: 1, designation: 'Ordinateur Portable Pro 15\"', prix_unitaire: 1200, categorie_id: 1 },
    { id: 2, designation: 'Souris sans fil', prix_unitaire: 35, categorie_id: 1 },
    { id: 3, designation: 'Clavier mécanique', prix_unitaire: 89, categorie_id: 1 },
    { id: 4, designation: 'Écran 27\" 4K', prix_unitaire: 450, categorie_id: 1 },
    { id: 5, designation: 'Consultation technique (jour)', prix_unitaire: 600, categorie_id: 2 },
    { id: 6, designation: 'Maintenance serveur (mois)', prix_unitaire: 200, categorie_id: 2 },
    { id: 7, designation: 'Formation React JS (session)', prix_unitaire: 1200, categorie_id: 3 },
    { id: 8, designation: 'Formation Node.js (session)', prix_unitaire: 1000, categorie_id: 3 },
  ];
  for (const a of articles) {
    await prisma.article.create({ data: a });
  }

  // ── CLIENTS (user standard) ──
  const c1 = await prisma.client.create({
    data: { nom: 'SARL Tech Innov', email: 'contact@techinnov.fr', tel: '01 23 45 67 89', adresse: '15 Rue de la Paix, 75002 Paris', user_id: user.id },
  });
  const c2 = await prisma.client.create({
    data: { nom: 'Sophie Martin', email: 'sophie.martin@gmail.com', tel: '06 12 34 56 78', adresse: '8 Avenue des Fleurs, 69001 Lyon', user_id: user.id },
  });
  const c3 = await prisma.client.create({
    data: { nom: 'EURL Batiservices', email: 'compta@batiservices.fr', tel: '04 91 23 45 67', adresse: '45 Rue de la République, 13001 Marseille', user_id: user.id },
  });

  // ── CLIENTS (admin) ──
  const cAdmin = await prisma.client.create({
    data: { nom: 'Mairie de Paris', email: 'factures@mairie-paris.fr', tel: '01 42 76 40 40', adresse: 'Place de l\'Hôtel de Ville, 75004 Paris', user_id: admin.id },
  });

  // ── INVOICE HELPER ──
  const date = (d: string) => new Date(d);
  const num = (n: number) => `F-${n.toString().padStart(6, '0')}`;

  // ── INVOICE 1 : brouillon (user) ──
  const inv1Articles = [
    { article_id: 1, designation: 'Ordinateur Portable Pro 15\"', quantite: 2, prix_unitaire: 1200, remise: 0, total_ligne: 2400, categorie_id: 1, tva: 20 },
    { article_id: 2, designation: 'Souris sans fil', quantite: 2, prix_unitaire: 35, remise: 0, total_ligne: 70, categorie_id: 1, tva: 20 },
  ];
  const inv1 = await prisma.invoice.create({
    data: {
      numero: num(1), date_creation: date('2026-06-01'), total_ht: 2470, tva: 494, total_ttc: 2964,
      statut: 'brouillon', user_id: user.id, client_id: c1.id,
      articles: { create: inv1Articles },
    },
  });
  await prisma.auditLog.create({
    data: { invoice_id: inv1.id, action: 'created', user_id: user.id, new_statut: 'brouillon' },
  });

  // ── INVOICE 2 : soumise (user) ──
  const inv2Articles = [
    { article_id: 5, designation: 'Consultation technique (jour)', quantite: 5, prix_unitaire: 600, remise: 0, total_ligne: 3000, categorie_id: 2, tva: 10 },
    { article_id: 6, designation: 'Maintenance serveur (mois)', quantite: 3, prix_unitaire: 200, remise: 10, total_ligne: 540, categorie_id: 2, tva: 10 },
  ];
  const inv2 = await prisma.invoice.create({
    data: {
      numero: num(2), date_creation: date('2026-06-05'), total_ht: 3540, tva: 354, total_ttc: 3894,
      statut: 'soumise', user_id: user.id, client_id: c2.id,
      articles: { create: inv2Articles },
    },
  });
  await prisma.auditLog.create({ data: { invoice_id: inv2.id, action: 'created', user_id: user.id, new_statut: 'brouillon' } });
  await prisma.auditLog.create({ data: { invoice_id: inv2.id, action: 'status_change:soumise', user_id: user.id, old_statut: 'brouillon', new_statut: 'soumise' } });

  // ── INVOICE 3 : payee (user) ──
  const inv3Articles = [
    { article_id: 7, designation: 'Formation React JS (session)', quantite: 1, prix_unitaire: 1200, remise: 0, total_ligne: 1200, categorie_id: 3, tva: 0 },
    { article_id: 8, designation: 'Formation Node.js (session)', quantite: 1, prix_unitaire: 1000, remise: 0, total_ligne: 1000, categorie_id: 3, tva: 0 },
  ];
  const inv3 = await prisma.invoice.create({
    data: {
      numero: num(3), date_creation: date('2026-05-20'), total_ht: 2200, tva: 0, total_ttc: 2200,
      statut: 'payee', user_id: user.id, client_id: c3.id,
      validated_by_admin: true, validated_by_client: true,
      date_depot: date('2026-05-25'), date_encaissement: date('2026-06-01'), type_virement: 'virement',
      articles: { create: inv3Articles },
    },
  });
  await prisma.auditLog.create({ data: { invoice_id: inv3.id, action: 'created', user_id: user.id, new_statut: 'brouillon' } });
  await prisma.auditLog.create({ data: { invoice_id: inv3.id, action: 'status_change:soumise', user_id: user.id, old_statut: 'brouillon', new_statut: 'soumise' } });
  await prisma.auditLog.create({ data: { invoice_id: inv3.id, action: 'status_change:validee_admin', user_id: admin.id, old_statut: 'soumise', new_statut: 'validee_admin' } });
  await prisma.auditLog.create({ data: { invoice_id: inv3.id, action: 'status_change:signee', user_id: admin.id, old_statut: 'validee_admin', new_statut: 'signee', details: 'Digitally signed by admin' } });
  await prisma.auditLog.create({ data: { invoice_id: inv3.id, action: 'status_change:payee', user_id: user.id, old_statut: 'en_attente_paiement', new_statut: 'payee' } });

  // ── INVOICE 4 : validee_admin (admin) ──
  const inv4Articles = [
    { article_id: 4, designation: 'Écran 27\" 4K', quantite: 10, prix_unitaire: 450, remise: 5, total_ligne: 4275, categorie_id: 1, tva: 20 },
  ];
  const inv4 = await prisma.invoice.create({
    data: {
      numero: num(4), date_creation: date('2026-06-10'), total_ht: 4275, tva: 855, total_ttc: 5130,
      statut: 'validee_admin', user_id: admin.id, client_id: cAdmin.id,
      validated_by_admin: true,
      articles: { create: inv4Articles },
    },
  });
  await prisma.auditLog.create({ data: { invoice_id: inv4.id, action: 'created', user_id: admin.id, new_statut: 'brouillon' } });
  await prisma.auditLog.create({ data: { invoice_id: inv4.id, action: 'status_change:soumise', user_id: admin.id, old_statut: 'brouillon', new_statut: 'soumise' } });
  await prisma.auditLog.create({ data: { invoice_id: inv4.id, action: 'status_change:validee_admin', user_id: admin.id, old_statut: 'soumise', new_statut: 'validee_admin' } });

  // ── QUOTES ──
  await prisma.quote.create({
    data: {
      numero_devis: 'DEV-2026-000001', client_nom: 'SARL Tech Innov', client_email: 'contact@techinnov.fr',
      client_id: c1.id, date_creation: date('2026-06-12'), date_validite: date('2026-07-12'),
      statut: 'envoye', total_ht: 1689, total_tva: 337.80, total_ttc: 2026.80,
      notes: 'Remise commerciale de 5% appliquée sur le lot.',
      user_id: user.id,
      articles: {
        create: [
          { article_id: 1, designation: 'Ordinateur Portable Pro 15\"', quantite: 1, prix_unitaire: 1200, categorie_nom: 'Informatique', tva: 20, total_ht: 1200, total_tva: 240 },
          { article_id: 3, designation: 'Clavier mécanique', quantite: 1, prix_unitaire: 89, categorie_nom: 'Informatique', tva: 20, total_ht: 89, total_tva: 17.80 },
          { article_id: 2, designation: 'Souris sans fil', quantite: 2, prix_unitaire: 35, categorie_nom: 'Informatique', tva: 20, total_ht: 70, total_tva: 14 },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      numero_devis: 'DEV-2026-000002', client_nom: 'Sophie Martin', client_email: 'sophie.martin@gmail.com',
      client_id: c2.id, date_creation: date('2026-06-15'), date_validite: date('2026-07-15'),
      statut: 'accepte', total_ht: 1800, total_tva: 180, total_ttc: 1980,
      user_id: user.id,
      articles: {
        create: [
          { article_id: 5, designation: 'Consultation technique (jour)', quantite: 3, prix_unitaire: 600, categorie_nom: 'Services', tva: 10, total_ht: 1800, total_tva: 180 },
        ],
      },
    },
  });

  console.log('=== Seed terminé avec succès ===');
  console.log('📊 Statistiques :');
  console.log(`   Utilisateurs   : 2 (admin + user)`);
  console.log(`   Catégories     : 3`);
  console.log(`   Articles       : 8`);
  console.log(`   Clients        : 4 (3 user + 1 admin)`);
  console.log(`   Factures       : 4 (brouillon, soumise, payee, validee_admin)`);
  console.log(`   Devis          : 2`);
  console.log(`   Audit logs     : 12`);
  console.log('');
  console.log('🔑 Comptes :');
  console.log(`   Admin : admin@invoice.com / admin123`);
  console.log(`   User  : user@invoice.com / user123`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
