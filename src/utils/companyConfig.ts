export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  siret: string;
  capital: string;
  city: string;
}

const STORAGE_KEY = 'company_info';

const defaults: CompanyInfo = {
  name: 'MA SOCIETE',
  address: '123 Rue de la République',
  phone: '+33 1 23 45 67 89',
  email: 'contact@masociete.fr',
  siret: '123 456 789 00012',
  capital: '1000',
  city: 'Paris',
};

export function getCompanyInfo(): CompanyInfo {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return { ...defaults };
}

export function saveCompanyInfo(info: Partial<CompanyInfo>): CompanyInfo {
  const current = getCompanyInfo();
  const updated = { ...current, ...info };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
