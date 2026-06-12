import { database, auth } from './firebaseService';
import { ref, push, get, update, remove, onValue } from 'firebase/database';
import { Client, Facture } from '../types';

export const clientService = {
  // Créer un client
  createClient: async (client: Omit<Client, 'id'>): Promise<Client> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const clientsRef = ref(database, `clients/${currentUser.uid}`);
    const newClientRef = await push(clientsRef, client);
    
    return {
      id: newClientRef.key!,
      ...client
    };
  },

  // Récupérer tous les clients
  getClients: async (): Promise<Client[]> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const clientsRef = ref(database, `clients/${currentUser.uid}`);
    const snapshot = await get(clientsRef);
    
    if (!snapshot.exists()) return [];
    
    const clients: Client[] = [];
    snapshot.forEach((childSnapshot) => {
      clients.push({
        id: childSnapshot.key!,
        ...childSnapshot.val()
      });
    });
    
    return clients;
  },

  // Mettre à jour un client
  updateClient: async (id: string, client: Partial<Client>): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const clientRef = ref(database, `clients/${currentUser.uid}/${id}`);
    await update(clientRef, client);
  },

  // Supprimer un client
  deleteClient: async (id: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const clientRef = ref(database, `clients/${currentUser.uid}/${id}`);
    await remove(clientRef);
  },

  // Écouter les changements de clients (temps réel)
  onClientsChange: (callback: (clients: Client[]) => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const clientsRef = ref(database, `clients/${currentUser.uid}`);
    
    return onValue(clientsRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const clients: Client[] = [];
      snapshot.forEach((childSnapshot) => {
        clients.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      
      callback(clients);
    });
  }
};

export const factureService = {
  // Créer une facture
  createFacture: async (facture: Omit<Facture, 'id'>): Promise<Facture> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const facturesRef = ref(database, `factures/${currentUser.uid}`);
    const newFactureRef = await push(facturesRef, facture);
    
    return {
      id: newFactureRef.key!,
      ...facture
    };
  },

  // Récupérer toutes les factures
  getFactures: async (isAdmin: boolean = false): Promise<Facture[]> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    if (isAdmin) {
      // Admin can see all invoices from all users
      const facturesRef = ref(database, 'factures');
      const snapshot = await get(facturesRef);
      
      if (!snapshot.exists()) return [];
      
      const factures: Facture[] = [];
      snapshot.forEach((userSnapshot) => {
        userSnapshot.forEach((childSnapshot) => {
          factures.push({
            id: childSnapshot.key!,
            user_id: userSnapshot.key, // Add user_id to track which user created it
            ...childSnapshot.val()
          });
        });
      });
      
      return factures;
    } else {
      // Regular users only see their own invoices
      const facturesRef = ref(database, `factures/${currentUser.uid}`);
      const snapshot = await get(facturesRef);
      
      if (!snapshot.exists()) return [];
      
      const factures: Facture[] = [];
      snapshot.forEach((childSnapshot) => {
        factures.push({
          id: childSnapshot.key!,
          user_id: currentUser.uid,
          ...childSnapshot.val()
        });
      });
      
      return factures;
    }
  },

  // Mettre à jour une facture
  updateFacture: async (id: string, facture: Partial<Facture>, userId?: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    // If userId is provided (admin editing another user's invoice), use that path
    // Otherwise use current user's path
    const targetUserId = userId || currentUser.uid;
    const factureRef = ref(database, `factures/${targetUserId}/${id}`);
    await update(factureRef, facture);
  },

  // Supprimer une facture
  deleteFacture: async (id: string, userId?: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    // If userId is provided (admin deleting another user's invoice), use that path
    // Otherwise use current user's path
    const targetUserId = userId || currentUser.uid;
    const factureRef = ref(database, `factures/${targetUserId}/${id}`);
    await remove(factureRef);
  },

  // Écouter les changements de factures (temps réel)
  onFacturesChange: (callback: (factures: Facture[]) => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');
    
    const facturesRef = ref(database, `factures/${currentUser.uid}`);
    
    return onValue(facturesRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const factures: Facture[] = [];
      snapshot.forEach((childSnapshot) => {
        factures.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      
      callback(factures);
    });
  }
};
