import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box, Paper, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Container, Card, CardContent, useTheme, alpha
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, PictureAsPdf as PdfIcon, Visibility as PreviewIcon } from '@mui/icons-material';
import { Facture, FactureArticle } from '../types';
import { invoiceApi } from '../services/api';
import { genererNumeroFacture, calculerTotauxFacture, calculerTotalLigne } from '../utils/calculations';
import { generateFacturePDF } from '../utils/pdfGenerator';
import { useData } from '../contexts/DataContext';
import { InvoicePreviewModal } from './InvoicePreviewModal';

export const InvoiceForm: React.FC = () => {
  const { clients, articles, categories, refreshInvoices } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const theme = useTheme();

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [factureArticles, setFactureArticles] = useState<FactureArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<number>(1);
  const [quantite, setQuantite] = useState<number>(1);
  const [remise, setRemise] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totaux, setTotaux] = useState({ totalHT: 0, totalTVA: 0, totalTTC: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const isEditing = !!editId;

  useEffect(() => {
    if (articles?.length && categories?.length) setDataLoaded(true);
  }, [articles, categories]);

  useEffect(() => {
    if (!editId || !dataLoaded) return;
    invoiceApi.get(editId).then((inv: Facture) => {
      setSelectedClient(inv.client_id);
      setFactureArticles(inv.articles.map(a => ({
        id: a.article_id,
        designation: a.designation,
        quantite: a.quantite,
        prix_unitaire: a.prix_unitaire,
        categorie_id: a.categorie_id,
        remise: a.remise || 0,
        total_ligne: a.total_ligne,
        tva: a.tva || 0,
      })));
      setPageLoading(false);
    }).catch(() => {
      toast.error('Facture introuvable');
      navigate('/dashboard');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, dataLoaded]);

  const calculerTotaux = useCallback(() => {
    if (!categories) return { totalHT: 0, totalTVA: 0, totalTTC: 0 };
    return calculerTotauxFacture(factureArticles, categories, 'par_categorie');
  }, [factureArticles, categories]);

  useEffect(() => {
    setTotaux(calculerTotaux());
  }, [calculerTotaux]);

  const ajouterArticle = () => {
    if (!articles?.length || !categories?.length) return;
    const article = articles.find(a => a.id === selectedArticle);
    if (!article) return;
    const categorie = categories.find(c => c.id === article.categorie_id);
    const totalLigne = calculerTotalLigne(quantite, article.prix_unitaire, remise);
    setFactureArticles(prev => [...prev, {
      id: article.id,
      designation: article.designation,
      quantite,
      prix_unitaire: article.prix_unitaire,
      categorie_id: article.categorie_id,
      remise,
      total_ligne: totalLigne,
      tva: categorie?.tva || 0,
    }]);
    setSelectedArticle(articles[0]?.id || 1);
    setQuantite(1);
    setRemise(0);
  };

  const supprimerArticle = (index: number) => {
    setFactureArticles(prev => prev.filter((_, i) => i !== index));
  };

  const sauvegarderFacture = async () => {
    if (!selectedClient) { toast.error('Veuillez sélectionner un client'); return; }
    if (!factureArticles.length) { toast.error('Ajoutez au moins un article'); return; }
    setLoading(true);
    try {
      const t = calculerTotaux();
      const payload = {
        client_id: selectedClient,
        total_ht: t.totalHT,
        tva: t.totalTVA,
        total_ttc: t.totalTTC,
        statut: 'brouillon',
        articles: factureArticles.map(a => ({
          article_id: a.id || 0,
          designation: a.designation,
          quantite: a.quantite,
          prix_unitaire: a.prix_unitaire,
          remise: a.remise || 0,
          total_ligne: a.total_ligne,
          categorie_id: a.categorie_id,
          tva: a.tva || 0,
        })),
      };

      if (isEditing) {
        await invoiceApi.update(editId, payload);
        toast.success('Facture modifiée!');
      } else {
        await invoiceApi.create({ ...payload, numero: genererNumeroFacture() });
        toast.success('Facture créée! Vous pouvez la soumettre depuis la liste.');
      }
      refreshInvoices();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const genererPDF = async () => {
    if (!selectedClient || !factureArticles.length) { toast.error('Complétez la facture'); return; }
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;
    const t = calculerTotaux();
    generateFacturePDF({
      id: 'temp', numero: genererNumeroFacture(), date_creation: new Date().toISOString(),
      client_id: selectedClient, articles: factureArticles, total_ht: t.totalHT,
      tva: t.totalTVA, total_ttc: t.totalTTC, statut: 'brouillon',
    } as Facture, client);
  };

  if (!dataLoaded || pageLoading) {
    return <Container maxWidth="lg"><Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3 }}><Typography>Chargement...</Typography></Paper></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          {isEditing ? 'Modification de Facture' : 'Création de Facture'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Client</Typography>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select value={selectedClient} label="Client" onChange={(e) => setSelectedClient(e.target.value)}>
                    {clients?.map(c => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Ajouter un Article</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Article</InputLabel>
                  <Select value={selectedArticle} label="Article" onChange={(e) => setSelectedArticle(Number(e.target.value))}>
                    {articles?.map(a => <MenuItem key={a.id} value={a.id}>{a.designation} - {a.prix_unitaire}€</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField label="Qté" type="number" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} />
                  <TextField label="Remise %" type="number" value={remise} onChange={(e) => setRemise(Number(e.target.value))} />
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={ajouterArticle} fullWidth>Ajouter</Button>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Articles</Typography>
              {factureArticles.length === 0 ? (
                <Typography color="text.secondary">Aucun article</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Désignation</TableCell>
                        <TableCell align="right">Qté</TableCell>
                        <TableCell align="right">Prix U.</TableCell>
                        <TableCell align="right">Remise</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {factureArticles.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell>{a.designation}</TableCell>
                          <TableCell align="right">{a.quantite}</TableCell>
                          <TableCell align="right">{a.prix_unitaire.toFixed(2)}€</TableCell>
                          <TableCell align="right">{a.remise ? `${a.remise}%` : '-'}</TableCell>
                          <TableCell align="right">{a.total_ligne.toFixed(2)}€</TableCell>
                          <TableCell align="right">
                            <IconButton color="error" onClick={() => supprimerArticle(i)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right"><Typography variant="h6">Total HT:</Typography></TableCell>
                        <TableCell align="right"><Typography variant="h6">{totaux.totalHT.toFixed(2)}€</Typography></TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} align="right"><Typography variant="h6">TVA:</Typography></TableCell>
                        <TableCell align="right"><Typography variant="h6">{totaux.totalTVA.toFixed(2)}€</Typography></TableCell>
                        <TableCell />
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={4} align="right"><Typography variant="h5">Total TTC:</Typography></TableCell>
                        <TableCell align="right"><Typography variant="h5" color="primary">{totaux.totalTTC.toFixed(2)}€</Typography></TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<PreviewIcon />} onClick={() => setPreviewOpen(true)}
              disabled={!selectedClient || !factureArticles.length}>Aperçu</Button>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={genererPDF}
              disabled={!factureArticles.length}>PDF</Button>
            <Button variant="contained" onClick={sauvegarderFacture}
              disabled={loading || !selectedClient || !factureArticles.length}>
              {loading ? 'En cours...' : isEditing ? 'Enregistrer' : 'Créer (brouillon)'}
            </Button>
          </Box>
        </Box>
      </Paper>

      <InvoicePreviewModal
        open={previewOpen} onClose={() => setPreviewOpen(false)}
        invoice={{
          numero: genererNumeroFacture(), date_creation: new Date().toISOString(),
          total_ht: totaux.totalHT, tva: totaux.totalTVA, total_ttc: totaux.totalTTC,
          statut: 'brouillon', client_id: selectedClient, articles: factureArticles,
        }}
        client={clients.find(c => c.id === selectedClient) || null}
        articles={factureArticles.map(a => ({
          id: a.id || 0, designation: a.designation, prix_unitaire: a.prix_unitaire,
          quantity: a.quantite, tva: categories.find(c => c.id === a.categorie_id)?.tva || 20, categorie_id: a.categorie_id,
        }))}
      />
    </Container>
  );
};
