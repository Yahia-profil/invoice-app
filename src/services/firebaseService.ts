import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, push, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBPEFaQnTHsgZTygdQ3fieSFFSGb1RWt5A",
  authDomain: "invoice-management-app-e55de.firebaseapp.com",
  projectId: "invoice-management-app-e55de",
  storageBucket: "invoice-management-app-e55de.firebasestorage.app",
  messagingSenderId: "275274117423",
  appId: "1:275274117423:web:578270abc20c6eff3eb1da",
  measurementId: "G-T5HH85ZTH2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Quote Management Functions
export interface Quote {
  id?: string;
  numero_devis: string;
  client_id: string;
  client_nom: string;
  client_email: string;
  date_creation: string;
  date_validite: string;
  statut: 'envoye' | 'accepte' | 'rejete' | 'expire';
  articles: Array<{
    article_id: number;
    designation: string;
    quantite: number;
    prix_unitaire: number;
    categorie_nom: string;
    tva: number;
    total_ht: number;
    total_tva: number;
  }>;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const createQuote = async (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  const quotesRef = ref(database, 'quotes');
  const newQuote = {
    ...quote,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await push(quotesRef, newQuote);
  return result.key!;
};

export const getQuotes = async (): Promise<Quote[]> => {
  const quotesRef = ref(database, 'quotes');
  const snapshot = await get(quotesRef);
  
  if (!snapshot.exists()) return [];
  
  const quotes: Quote[] = [];
  snapshot.forEach((childSnapshot) => {
    quotes.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  
  return quotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateQuote = async (id: string, updates: Partial<Quote>): Promise<void> => {
  const quoteRef = ref(database, `quotes/${id}`);
  await update(quoteRef, {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

export const deleteQuote = async (id: string): Promise<void> => {
  const quoteRef = ref(database, `quotes/${id}`);
  await remove(quoteRef);
};

export const getQuoteById = async (id: string): Promise<Quote | null> => {
  const quoteRef = ref(database, `quotes/${id}`);
  const snapshot = await get(quoteRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.key,
    ...snapshot.val()
  };
};

export const getQuotesByClient = async (clientId: string): Promise<Quote[]> => {
  const quotesRef = ref(database, 'quotes');
  const q = query(quotesRef, orderByChild('client_id'), equalTo(clientId));
  const snapshot = await get(q);
  
  if (!snapshot.exists()) return [];
  
  const quotes: Quote[] = [];
  snapshot.forEach((childSnapshot) => {
    quotes.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  
  return quotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export default app;
