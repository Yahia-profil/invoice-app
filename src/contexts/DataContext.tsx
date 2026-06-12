import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, Article, Categorie, Facture } from '../types';
import { clientApi, invoiceApi, articleApi, categoryApi } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  articles: Article[];
  categories: Categorie[];
  invoices: Facture[];
  refreshClients: () => void;
  refreshArticles: () => void;
  refreshInvoices: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [invoices, setInvoices] = useState<Facture[]>([]);

  const refreshClients = useCallback(async () => {
    try {
      const data = await clientApi.list();
      setClients(data);
    } catch (err: any) {
      console.error('Error refreshing clients:', err);
    }
  }, []);

  const refreshArticles = useCallback(async () => {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        articleApi.list(),
        categoryApi.list(),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('Error refreshing articles:', err);
    }
  }, []);

  const refreshInvoices = useCallback(async () => {
    try {
      const data = await invoiceApi.list();
      setInvoices(data);
    } catch (err: any) {
      console.error('Error refreshing invoices:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshClients();
      refreshArticles();
      refreshInvoices();
    }
  }, [currentUser, refreshClients, refreshArticles, refreshInvoices]);

  const value = { clients, articles, categories, invoices, refreshClients, refreshArticles, refreshInvoices };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
