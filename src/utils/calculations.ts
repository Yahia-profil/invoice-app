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
  let totalHT = 0;
  let totalTVA = 0;

  if (methodeCalcul === 'par_categorie') {
    const totauxParCategorie: { [key: number]: { ht: number; tva: number } } = {};

    articles.forEach(article => {
      const categorie = categories.find(c => c.id.toString() === article.categorie_id.toString());
      if (categorie) {
        if (!totauxParCategorie[categorie.id]) {
          totauxParCategorie[categorie.id] = { ht: 0, tva: 0 };
        }
        totauxParCategorie[categorie.id].ht += article.total_ligne;
      }
    });

    Object.keys(totauxParCategorie).forEach(categorieId => {
      const categorie = categories.find(c => c.id.toString() === categorieId.toString());
      if (categorie) {
        const htCategorie = totauxParCategorie[parseInt(categorieId)].ht;
        totalHT += htCategorie;
        totalTVA += calculerTVA(htCategorie, categorie.tva);
      }
    });
  } else {
    totalHT = articles.reduce((sum, article) => sum + article.total_ligne, 0);
    totalTVA = calculerTVA(totalHT, 20);
  }

  if (remiseGlobale > 0) {
    const remiseMontant = totalHT * (remiseGlobale / 100);
    totalHT -= remiseMontant;
    totalTVA = calculerTVA(totalHT, 20);
  }

  const totalTTC = calculerTotalTTC(totalHT, totalTVA);

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
