import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facture, Client } from '../types';

export const generateFacturePDF = (facture: Facture, client: Client) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('MA SOCIETE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Adresse: 123 Rue de la République', 20, 35);
  doc.text('Téléphone: +33 1 23 45 67 89', 20, 40);
  doc.text('Email: contact@masociete.fr', 20, 45);
  doc.text('SIRET: 123 456 789 00012', 20, 50);

  doc.setFontSize(12);
  doc.text('Client:', 120, 35);
  doc.setFontSize(10);
  doc.text(client.nom, 120, 40);
  doc.text(client.adresse, 120, 45);
  doc.text(client.email, 120, 50);
  doc.text(client.tel, 120, 55);

  doc.setFontSize(14);
  doc.text(`FACTURE N°: ${facture.numero}`, 20, 70);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(facture.date_creation).toLocaleDateString('fr-FR')}`, 20, 75);
  doc.text(`Statut: ${getStatusLabel(facture.statut).toUpperCase()}`, 20, 80);

  const tableData = facture.articles.map(article => [
    article.designation,
    article.quantite.toString(),
    `${article.prix_unitaire.toFixed(2)} €`,
    article.remise ? `${article.remise}%` : '0%',
    `${article.total_ligne.toFixed(2)} €`
  ]);

  autoTable(doc, {
    head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Remise', 'Total']],
    body: tableData,
    startY: 90,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total HT: ${facture.total_ht.toFixed(2)} €`, 140, finalY);
  doc.text(`TVA: ${facture.tva.toFixed(2)} €`, 140, finalY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total TTC: ${facture.total_ttc.toFixed(2)} €`, 140, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Conditions de paiement: Paiement à réception de facture', 20, finalY + 25);
  doc.text('Pénalités de retard: 3 fois le taux d\'intérêt légal', 20, finalY + 30);

  if (facture.signature) {
    const sigY = finalY + 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SIGNATURE NUMÉRIQUE', 20, sigY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Signé le: ${new Date(facture.signature.signed_at).toLocaleString('fr-FR')}`, 20, sigY + 6);
    doc.text(`Algorithme: ${facture.signature.algorithm}`, 20, sigY + 11);
    doc.text(`Empreinte: ${facture.signature.signed_hash.substring(0, 40)}...`, 20, sigY + 16);
    doc.text(`Vérifiable auprès de l'administrateur`, 20, sigY + 21);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(20, sigY + 24, 190, sigY + 24);
  }

  doc.save(`facture_${facture.numero}.pdf`);
  return doc;
};

export const generateDevisPDF = (facture: Facture, client: Client) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('MA SOCIETE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text('Adresse: 123 Rue de la République', 20, 35);
  doc.text('Téléphone: +33 1 23 45 67 89', 20, 40);
  doc.text('Email: contact@masociete.fr', 20, 45);
  doc.text('SIRET: 123 456 789 00012', 20, 50);

  doc.setFontSize(12);
  doc.text('Client:', 120, 35);
  doc.setFontSize(10);
  doc.text(client.nom, 120, 40);
  doc.text(client.adresse, 120, 45);
  doc.text(client.email, 120, 50);
  doc.text(client.tel, 120, 55);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVIS', 105, 70, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`N° DEVIS: ${facture.numero.replace('FACT-', 'DEV-')}`, 20, 80);
  doc.text(`Date: ${new Date(facture.date_creation).toLocaleDateString('fr-FR')}`, 20, 85);
  doc.text(`Validité: 30 jours`, 20, 90);
  doc.text(`Statut: ${getStatusLabel(facture.statut).toUpperCase()}`, 20, 95);

  const tableData = facture.articles.map(article => [
    article.designation,
    article.quantite.toString(),
    `${article.prix_unitaire.toFixed(2)} €`,
    article.remise ? `${article.remise}%` : '0%',
    `${article.total_ligne.toFixed(2)} €`
  ]);

  autoTable(doc, {
    head: [['Désignation', 'Quantité', 'Prix Unitaire', 'Remise', 'Total']],
    body: tableData,
    startY: 105,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total HT: ${facture.total_ht.toFixed(2)} €`, 140, finalY);
  doc.text(`TVA: ${facture.tva.toFixed(2)} €`, 140, finalY + 5);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total TTC: ${facture.total_ttc.toFixed(2)} €`, 140, finalY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Ce document est un devis. Il ne constitue pas une facture.', 20, finalY + 25);
  doc.text('Il deviendra une facture après validation et signature administrative.', 20, finalY + 30);

  doc.save(`devis_${facture.numero}.pdf`);
  return doc;
};

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    brouillon: 'Brouillon',
    soumise: 'Soumise',
    validee_admin: 'Validée par admin',
    en_attente_signature: 'En attente signature',
    signee: 'Signée numériquement',
    en_attente_paiement: 'En attente de paiement',
    payee: 'Payée',
    rejetee: 'Rejetée',
    rejetee_admin: 'Rejetée par admin',
  };
  return labels[status] || status;
}
