import { FactureArticle, Categorie } from '../types';

export const calculerTotalLigne = (
  quantite: number,
  prixUnitaire: number,
  remise: number = 0
): number => {
  const sousTotal = quantite * prixUnitaire;
  const montantRemise = sousTotal * (remise / 100);
  return sousTotal - montantRemise;
};

export const calculerTVA = (totalHT: number, tauxTVA: number): number => {
  return totalHT * (tauxTVA / 100);
};

export const calculerTotalTTC = (totalHT: number, tva: number): number => {
  return totalHT + tva;
};

export const calculerTotauxFacture = (
  articles: FactureArticle[],
  categories: Categorie[],
  methodeCalcul: 'simple' | 'remise_ligne' | 'remise_globale' | 'par_categorie' = 'simple',
  remiseGlobale: number = 0
) => {
  console.log('calculerTotauxFacture - articles:', articles);
  console.log('calculerTotauxFacture - categories:', categories);
  console.log('calculerTotauxFacture - methodeCalcul:', methodeCalcul);
  
  let totalHT = 0;
  let totalTVA = 0;

  if (methodeCalcul === 'par_categorie') {
    console.log('Using par_categorie calculation method');
    // Calcul par catégorie avec TVA différente
    const totauxParCategorie: { [key: number]: { ht: number; tva: number } } = {};
    
    articles.forEach(article => {
      console.log('Processing article:', article);
      console.log('Looking for category with ID:', article.categorie_id);
      const categorie = categories.find(c => c.id.toString() === article.categorie_id.toString());
      console.log('Found category:', categorie);
      if (categorie) {
        if (!totauxParCategorie[categorie.id]) {
          totauxParCategorie[categorie.id] = { ht: 0, tva: 0 };
        }
        totauxParCategorie[categorie.id].ht += article.total_ligne;
        console.log('Added to category total:', totauxParCategorie[categorie.id]);
      }
    });

    console.log('Totaux par catégorie:', totauxParCategorie);

    Object.keys(totauxParCategorie).forEach(categorieId => {
      const categorie = categories.find(c => c.id.toString() === categorieId.toString());
      console.log('Processing category ID:', categorieId, 'Found category:', categorie);
      if (categorie) {
        const htCategorie = totauxParCategorie[parseInt(categorieId)].ht;
        console.log('Category HT total:', htCategorie, 'TVA rate:', categorie.tva);
        totalHT += htCategorie;
        totalTVA += calculerTVA(htCategorie, categorie.tva);
        console.log('After adding - Total HT:', totalHT, 'Total TVA:', totalTVA);
      }
    });
  } else {
    console.log('Using simple calculation method');
    // Calcul simple HT + TVA à 20%
    totalHT = articles.reduce((sum, article) => sum + article.total_ligne, 0);
    totalTVA = calculerTVA(totalHT, 20);
  }

  // Appliquer remise globale si spécifiée
  if (remiseGlobale > 0) {
    const remiseMontant = totalHT * (remiseGlobale / 100);
    totalHT -= remiseMontant;
    totalTVA = calculerTVA(totalHT, 20); // Recalculer TVA après remise
  }

  const totalTTC = calculerTotalTTC(totalHT, totalTVA);

  console.log('Final totals calculated:', { totalHT, totalTVA, totalTTC });

  return {
    totalHT,
    totalTVA,
    totalTTC
  };
};

export const genererNumeroFacture = (): string => {
  const date = new Date();
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-6);
  return `F${annee}${mois}${jour}${timestamp}`;
};
