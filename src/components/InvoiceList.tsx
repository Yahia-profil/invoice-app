import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Container,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, useTheme, alpha, InputAdornment, Menu, MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon, MoreVert as MoreIcon,
  PictureAsPdf as PdfIcon, Search as SearchIcon,
  Payment as PaymentIcon, Edit as EditIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { Facture, TypeVirement } from '../types';
import { invoiceApi } from '../services/api';
import { generateFacturePDF, generateDevisPDF } from '../utils/pdfGenerator';
import { useData } from '../contexts/DataContext';
import { StatusBadge } from './StatusBadge';

export const InvoiceList: React.FC = () => {
  const { clients, invoices, refreshInvoices } = useData();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Facture | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [paymentData, setPaymentData] = useState({
    date_depot: '',
    date_encaissement: '',
    type_virement: 'virement' as TypeVirement,
    statut: 'en_attente_paiement' as string,
  });

  const filteredInvoices = useMemo(() => {
    if (searchTerm === '') return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(inv => {
      const client = clients.find(c => c.id === inv.client_id);
      return inv.numero.toLowerCase().includes(term) ||
        inv.statut.toLowerCase().includes(term) ||
        (client?.nom || '').toLowerCase().includes(term) ||
        inv.total_ttc.toString().includes(term);
    });
  }, [searchTerm, invoices, clients]);

  const handleDelete = async (invoice: Facture) => {
    if (!window.confirm(`Supprimer la facture "${invoice.numero}" ?`)) return;
    try {
      await invoiceApi.delete(invoice.id);
      refreshInvoices();
      toast.success('Facture supprimée!');
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmitForValidation = async (invoice: Facture) => {
    try {
      await invoiceApi.changeStatus(invoice.id, 'soumise');
      refreshInvoices();
      toast.success('Facture soumise pour validation admin');
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (invoice: Facture) => {
    navigate(`/invoice-form?id=${invoice.id}`);
  };

  const handleGeneratePDF = (invoice: Facture) => {
    const client = clients.find(c => c.id === invoice.client_id);
    if (!client) return;
    generateFacturePDF(invoice, client);
    toast.success('Facture PDF générée!');
  };

  const handleGenerateDevis = (invoice: Facture) => {
    const client = clients.find(c => c.id === invoice.client_id);
    if (!client) return;
    generateDevisPDF(invoice, client);
    toast.success('Devis PDF généré!');
  };

  const canDownloadFacture = (statut: string) =>
    ['signee', 'en_attente_paiement', 'payee'].includes(statut);

  const canDownloadDevis = (statut: string) =>
    ['brouillon', 'soumise', 'validee_admin', 'en_attente_signature', 'rejetee_admin'].includes(statut);

  const handlePaymentStatus = async (invoice: Facture) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      date_depot: invoice.date_depot || '',
      date_encaissement: invoice.date_encaissement || '',
      type_virement: (invoice.type_virement as TypeVirement) || 'virement',
      statut: invoice.statut,
    });
    setPaymentDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedInvoice) return;
    try {
      await invoiceApi.updatePayment(selectedInvoice.id, paymentData);
      refreshInvoices();
      toast.success('Paiement mis à jour!');
      setPaymentDialogOpen(false);
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, invoice: Facture) => {
    setAnchorEl(e.currentTarget);
    setSelectedInvoice(invoice);
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Liste des Factures</Typography>
          <Button variant="contained" startIcon={<PdfIcon />} onClick={() => navigate('/invoice-form')}>
            Créer une facture
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3, background: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
          <TextField fullWidth placeholder="Rechercher..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> } }}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper', borderRadius: 2 } }} />
        </Paper>

        {filteredInvoices.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">Aucune facture trouvée</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Numéro</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const client = clients.find(c => c.id === invoice.client_id);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.numero}</TableCell>
                      <TableCell>{client?.nom || 'N/A'}</TableCell>
                      <TableCell>{new Date(invoice.date_creation).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{invoice.total_ttc.toFixed(2)}€</TableCell>
                      <TableCell><StatusBadge status={invoice.statut} size="small" variant="outlined" /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {invoice.statut === 'brouillon' && (
                            <>
                              <Button size="small" color="primary" onClick={() => handleSubmitForValidation(invoice)}>
                                Soumettre
                              </Button>
                              <IconButton size="small" color="default" onClick={() => handleEdit(invoice)} title="Modifier">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                          {canDownloadDevis(invoice.statut) && (
                            <Button size="small" color="secondary" startIcon={<PdfIcon />}
                              onClick={() => handleGenerateDevis(invoice)}>
                              Devis
                            </Button>
                          )}
                          {canDownloadFacture(invoice.statut) && (
                            <Button size="small" color="info" startIcon={<PdfIcon />}
                              onClick={() => handleGeneratePDF(invoice)}>
                              Facture
                            </Button>
                          )}
                          {invoice.statut === 'en_attente_paiement' && (
                            <Button size="small" color="info" startIcon={<PaymentIcon />}
                              onClick={() => handlePaymentStatus(invoice)}>
                              Paiement
                            </Button>
                          )}
                          {(invoice.statut === 'payee') && (
                            <Button size="small" color="success" startIcon={<PaymentIcon />}
                              onClick={() => handlePaymentStatus(invoice)}>
                              Paiement
                            </Button>
                          )}
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, invoice)}>
                            <MoreIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && !!selectedInvoice}
          onClose={() => { setAnchorEl(null); setSelectedInvoice(null); }}>
          {selectedInvoice && (
            [
              selectedInvoice.statut === 'brouillon' && (
                <MenuItem key="edit" onClick={() => { handleEdit(selectedInvoice); setAnchorEl(null); }}>
                  <EditIcon sx={{ mr: 1, fontSize: 16 }} /> Modifier
                </MenuItem>
              ),
              canDownloadDevis(selectedInvoice.statut) && (
                <MenuItem key="devis" onClick={() => { handleGenerateDevis(selectedInvoice); setAnchorEl(null); }}>
                  <PdfIcon sx={{ mr: 1, fontSize: 16 }} /> Télécharger Devis
                </MenuItem>
              ),
              canDownloadFacture(selectedInvoice.statut) && (
                <MenuItem key="facture" onClick={() => { handleGeneratePDF(selectedInvoice); setAnchorEl(null); }}>
                  <PdfIcon sx={{ mr: 1, fontSize: 16 }} /> Télécharger Facture
                </MenuItem>
              ),
              selectedInvoice.statut === 'brouillon' && (
                <MenuItem key="soumettre" onClick={() => { handleSubmitForValidation(selectedInvoice); setAnchorEl(null); }}>
                  <SendIcon sx={{ mr: 1, fontSize: 16 }} /> Soumettre
                </MenuItem>
              ),
              (selectedInvoice.statut === 'soumise' || selectedInvoice.statut === 'rejetee_admin') && (
                <MenuItem key="delete" onClick={() => { handleDelete(selectedInvoice); setAnchorEl(null); }}>
                  <DeleteIcon sx={{ mr: 1, fontSize: 16 }} /> Supprimer
                </MenuItem>
              ),
            ].filter(Boolean) as React.ReactElement[]
          )}
        </Menu>

        <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Suivi des Paiements</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select value={paymentData.statut} label="Statut"
                  onChange={(e) => setPaymentData({ ...paymentData, statut: e.target.value })}>
                  <MenuItem value="en_attente_paiement">En attente paiement</MenuItem>
                  <MenuItem value="payee">Payée</MenuItem>
                  <MenuItem value="rejetee">Rejetée</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Date de dépôt" type="date" value={paymentData.date_depot}
                onChange={(e) => setPaymentData({ ...paymentData, date_depot: e.target.value })}
                slotProps={{ htmlInput: { shrink: true } }} />
              <TextField label="Date d'encaissement" type="date" value={paymentData.date_encaissement}
                onChange={(e) => setPaymentData({ ...paymentData, date_encaissement: e.target.value })}
                slotProps={{ htmlInput: { shrink: true } }} />
              <FormControl fullWidth>
                <InputLabel>Type de virement</InputLabel>
                <Select value={paymentData.type_virement} label="Type"
                  onChange={(e) => setPaymentData({ ...paymentData, type_virement: e.target.value as TypeVirement })}>
                  <MenuItem value="virement">Virement</MenuItem>
                  <MenuItem value="cheque">Chèque</MenuItem>
                  <MenuItem value="espece">Espèce</MenuItem>
                  <MenuItem value="autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdatePayment} variant="contained">Mettre à jour</Button>
          </DialogActions>
        </Dialog>

      </Paper>
    </Container>
  );
};
