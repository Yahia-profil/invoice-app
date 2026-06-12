export interface Article {
  id: number;
  designation: string;
  prix_unitaire: number;
  categorie_id: number;
  category?: Categorie;
}

export interface Categorie {
  id: number;
  nom: string;
  tva: number;
}

export interface Client {
  id: string;
  nom: string;
  email: string;
  tel: string;
  adresse: string;
  public_key?: string;
}

export interface FactureArticle {
  id?: number;
  article_id?: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  categorie_id: number;
  remise?: number;
  total_ligne: number;
  tva?: number;
}

export interface InvoiceArticle extends FactureArticle {
  invoice_id?: string;
}

export interface Facture {
  id: string;
  numero: string;
  date_creation: string;
  client_id: string;
  articles: FactureArticle[];
  total_ht: number;
  tva: number;
  total_ttc: number;
  statut: InvoiceStatus;
  date_depot?: string;
  date_encaissement?: string;
  type_virement?: TypeVirement;
  validated_by_admin?: boolean;
  validated_by_client?: boolean;
  user_id?: string;
  notes?: string;
  client?: Client;
  signature?: Signature;
  audit_logs?: AuditLog[];
}

export type InvoiceStatus =
  | 'brouillon'
  | 'soumise'
  | 'validee_admin'
  | 'en_attente_signature'
  | 'signee'
  | 'en_attente_paiement'
  | 'payee'
  | 'rejetee'
  | 'rejetee_admin';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  nom?: string;
}

export type TypeVirement = 'virement' | 'cheque' | 'espece' | 'autre';

export interface Quote {
  id?: string;
  numero_devis: string;
  client_nom: string;
  client_email: string;
  client_id: string;
  date_creation: string;
  date_validite: string;
  statut: string;
  articles: QuoteArticle[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  notes?: string;
  created_at: string;
}

export interface QuoteArticle {
  id?: number;
  article_id: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  categorie_nom: string;
  tva: number;
  total_ht: number;
  total_tva: number;
}

export interface Signature {
  id: string;
  invoice_id: string;
  signature_data: string;
  signed_hash: string;
  public_key: string;
  algorithm: string;
  signed_at: string;
}

export interface AuditLog {
  id: string;
  invoice_id: string;
  action: string;
  old_statut?: string;
  new_statut?: string;
  user_id: string;
  details?: string;
  created_at: string;
}

export type StatutFacture = InvoiceStatus;
