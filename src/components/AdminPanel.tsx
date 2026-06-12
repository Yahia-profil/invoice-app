import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Container, useTheme, alpha, Tabs, Tab
} from '@mui/material';
import {
  Check as CheckIcon, Close as CloseIcon, VerifiedUser as ValidateIcon,
  Article as ArticleIcon, Category as CategoryIcon, VerifiedUser as SignIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { Facture } from '../types';
import { invoiceApi, articleApi, categoryApi } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { SignatureDialog } from './SignatureDialog';

export const AdminPanel: React.FC = () => {
  const { invoices, categories, refreshInvoices, refreshArticles } = useData();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState<Facture[]>([]);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const [newArticle, setNewArticle] = useState({ designation: '', prix_unitaire: '', categorie_id: '' });
  const [newCategory, setNewCategory] = useState({ nom: '', tva: '' });
  const [signInvoice, setSignInvoice] = useState<Facture | null>(null);

  useEffect(() => {
    loadPending();
  }, [invoices]);

  const loadPending = async () => {
    try {
      const data = await invoiceApi.pending();
      setPendingInvoices(data);
    } catch { /* ignore */ }
  };

  const handleAdminValidate = async (invoice: Facture, action: 'validee_admin' | 'rejetee_admin') => {
    try {
      await invoiceApi.changeStatus(invoice.id, action);
      toast.success(action === 'validee_admin' ? 'Facture validée!' : 'Facture rejetée');
      refreshInvoices();
      loadPending();
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateArticle = async () => {
    try {
      await articleApi.create({
        designation: newArticle.designation,
        prix_unitaire: parseFloat(newArticle.prix_unitaire),
        categorie_id: parseInt(newArticle.categorie_id),
      });
      toast.success('Article créé!');
      setArticleDialogOpen(false);
      setNewArticle({ designation: '', prix_unitaire: '', categorie_id: '' });
      refreshArticles();
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateCategory = async () => {
    try {
      await categoryApi.create({ nom: newCategory.nom, tva: parseFloat(newCategory.tva) });
      toast.success('Catégorie créée!');
      setCategoryDialogOpen(false);
      setNewCategory({ nom: '', tva: '' });
      refreshArticles();
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const invoicesForCurrentTab = tabValue === 0
    ? invoices.filter(inv => ['soumise', 'validee_admin', 'signee', 'en_attente_paiement'].includes(inv.statut))
    : invoices.filter(inv => ['brouillon', 'payee', 'rejetee', 'rejetee_admin'].includes(inv.statut));

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Administration</Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="En cours" />
            <Tab label="Historique" />
          </Tabs>
        </Box>

        {pendingInvoices.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: alpha('#f59e0b', 0.1), border: `1px solid ${alpha('#f59e0b', 0.3)}` }}>
            <Typography sx={{ fontWeight: 600, color: '#92400e' }}>
              {pendingInvoices.length} facture(s) en attente de validation
            </Typography>
          </Paper>
        )}

        <Box sx={{ mb: 4 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Total TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoicesForCurrentTab.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.numero}</TableCell>
                    <TableCell>{invoice.client?.nom || 'N/A'}</TableCell>
                    <TableCell>{invoice.total_ttc.toFixed(2)}€</TableCell>
                    <TableCell><StatusBadge status={invoice.statut} size="small" /></TableCell>
                    <TableCell>
                      {invoice.statut === 'soumise' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" color="success" variant="contained"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAdminValidate(invoice, 'validee_admin')}>
                            Valider
                          </Button>
                          <Button size="small" color="error" variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => handleAdminValidate(invoice, 'rejetee_admin')}>
                            Rejeter
                          </Button>
                        </Box>
                      )}
                      {invoice.statut === 'validee_admin' && (
                        <Button size="small" color="primary" variant="contained"
                          startIcon={<SignIcon />} onClick={() => setSignInvoice(invoice)}>
                          Signer
                        </Button>
                      )}
                      {invoice.statut === 'signee' && (
                        <Chip icon={<CheckIcon />} label="Signée" color="success" size="small" />
                      )}
                      {invoice.statut === 'en_attente_paiement' && (
                        <Chip icon={<ValidateIcon />} label="En attente de paiement" color="warning" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<ArticleIcon />} onClick={() => setArticleDialogOpen(true)}>
            Ajouter un Article
          </Button>
          <Button variant="contained" startIcon={<CategoryIcon />} onClick={() => setCategoryDialogOpen(true)}>
            Ajouter une Catégorie
          </Button>
        </Box>

        <Dialog open={articleDialogOpen} onClose={() => setArticleDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un Article</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField label="Désignation" value={newArticle.designation}
                onChange={(e) => setNewArticle({ ...newArticle, designation: e.target.value })} fullWidth />
              <TextField label="Prix unitaire" type="number" value={newArticle.prix_unitaire}
                onChange={(e) => setNewArticle({ ...newArticle, prix_unitaire: e.target.value })} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select value={newArticle.categorie_id} label="Catégorie"
                  onChange={(e) => setNewArticle({ ...newArticle, categorie_id: e.target.value })}>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.nom} ({c.tva}% TVA)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setArticleDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateArticle} variant="contained">Créer</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter une Catégorie</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField label="Nom" value={newCategory.nom}
                onChange={(e) => setNewCategory({ ...newCategory, nom: e.target.value })} fullWidth />
              <TextField label="TVA (%)" type="number" value={newCategory.tva}
                onChange={(e) => setNewCategory({ ...newCategory, tva: e.target.value })} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateCategory} variant="contained">Créer</Button>
          </DialogActions>
        </Dialog>
      </Paper>

      {signInvoice && (
        <SignatureDialog open={!!signInvoice}
          onClose={() => { setSignInvoice(null); refreshInvoices(); }}
          invoice={signInvoice} onSigned={() => { setSignInvoice(null); refreshInvoices(); }} />
      )}
    </Container>
  );
};
