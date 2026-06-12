import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Card, CardContent, Alert, CircularProgress
} from '@mui/material';
import { Delete, Save, PictureAsPdf } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale/fr';
import { useData } from '../contexts/DataContext';
import { quoteApi } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const QuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const { clients, articles, categories } = useData();
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (articles?.length > 0 && categories?.length > 0) setDataLoaded(true);
  }, [articles, categories]);

  const [formData, setFormData] = useState({
    client_id: '',
    date_creation: new Date(),
    date_validite: new Date(new Date().setDate(new Date().getDate() + 30)),
    notes: '',
    articles: [] as Array<{
      article_id: number; designation: string; quantite: number;
      prix_unitaire: number; categorie_nom: string; tva: number;
      total_ht: number; total_tva: number;
    }>,
  });

  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEV-${year}-${random}`;
  };

  const calculerTotauxArticle = (quantite: number, prix_unitaire: number, tva: number) => {
    const total_ht = quantite * prix_unitaire;
    const total_tva = total_ht * (tva / 100);
    return { total_ht, total_tva };
  };

  const calculerTotaux = () => {
    const total_ht = formData.articles.reduce((sum, a) => sum + a.total_ht, 0);
    const total_tva = formData.articles.reduce((sum, a) => sum + a.total_tva, 0);
    return { total_ht, total_tva, total_ttc: total_ht + total_tva };
  };

  const addArticle = (articleId: number) => {
    if (!articles || !categories) return;
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    const categorie = categories.find(c => c.id === article.categorie_id);
    if (!categorie) return;
    const { total_ht, total_tva } = calculerTotauxArticle(1, article.prix_unitaire, categorie.tva);
    setFormData(prev => ({
      ...prev,
      articles: [...prev.articles, {
        article_id: article.id, designation: article.designation, quantite: 1,
        prix_unitaire: article.prix_unitaire, categorie_nom: categorie.nom,
        tva: categorie.tva, total_ht, total_tva,
      }],
    }));
  };

  const updateArticleQuantity = (index: number, quantite: number) => {
    if (quantite < 1) return;
    setFormData(prev => {
      const newArticles = [...prev.articles];
      const a = newArticles[index];
      const { total_ht, total_tva } = calculerTotauxArticle(quantite, a.prix_unitaire, a.tva);
      newArticles[index] = { ...a, quantite, total_ht, total_tva };
      return { ...prev, articles: newArticles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || formData.articles.length === 0) {
      toast.error('Sélectionnez un client et ajoutez au moins un article');
      return;
    }
    const client = clients.find(c => c.id === formData.client_id);
    if (!client) return;
    setLoading(true);
    try {
      const t = calculerTotaux();
      await quoteApi.create({
        numero_devis: generateQuoteNumber(),
        client_id: formData.client_id,
        client_nom: client.nom,
        client_email: client.email,
        date_validite: formData.date_validite.toISOString(),
        statut: 'envoye',
        total_ht: t.total_ht,
        total_tva: t.total_tva,
        total_ttc: t.total_ttc,
        notes: formData.notes,
        articles: formData.articles,
      });
      toast.success('Devis créé!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const generatePDF = () => {
    const client = clients.find(c => c.id === formData.client_id);
    if (!client || formData.articles.length === 0) return;
    const doc = new jsPDF();
    const t = calculerTotaux();
    doc.setFontSize(20); doc.text('DEVIS', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Numéro: ${generateQuoteNumber()}`, 20, 40);
    doc.text(`Date: ${formData.date_creation.toLocaleDateString('fr-FR')}`, 20, 50);
    doc.text(`Validité: ${formData.date_validite.toLocaleDateString('fr-FR')}`, 20, 60);
    doc.text('Client:', 20, 80);
    doc.setFontSize(10);
    doc.text(client.nom, 20, 90);
    doc.text(client.email, 20, 100);
    const tableData = formData.articles.map(a => [a.designation, a.quantite.toString(), `${a.prix_unitaire.toFixed(2)} €`, `${a.total_ht.toFixed(2)} €`, `${a.tva}%`, `${a.total_tva.toFixed(2)} €`]);
    autoTable(doc, { head: [['Désignation', 'Qté', 'Prix U', 'Total HT', 'TVA', 'Total TVA']], body: tableData, startY: 130, theme: 'grid' });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total HT: ${t.total_ht.toFixed(2)} €`, 140, finalY);
    doc.text(`Total TVA: ${t.total_tva.toFixed(2)} €`, 140, finalY + 10);
    doc.text(`Total TTC: ${t.total_ttc.toFixed(2)} €`, 140, finalY + 20);
    if (formData.notes) { doc.text('Notes:', 20, finalY + 40); doc.setFontSize(10); doc.text(formData.notes, 20, finalY + 50); }
    doc.save(`devis-${generateQuoteNumber()}.pdf`);
  };

  if (!dataLoaded) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', minHeight: '50vh', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}><CircularProgress sx={{ mb: 2 }} /><Typography>Chargement...</Typography></Box>
      </Box>
    );
  }

  const totaux = calculerTotaux();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Créer un Devis</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Client</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Client</InputLabel>
                  <Select value={formData.client_id} label="Client" onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}>
                    {clients.map(c => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}
                  </Select>
                </FormControl>
                <DatePicker label="Date création" value={formData.date_creation} onChange={(d) => d && setFormData(p => ({ ...p, date_creation: d }))} sx={{ width: '100%', mb: 2 }} />
                <DatePicker label="Date validité" value={formData.date_validite} onChange={(d) => d && setFormData(p => ({ ...p, date_validite: d }))} sx={{ width: '100%' }} />
              </CardContent></Card>
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Articles</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Article</InputLabel>
                  <Select value="" label="Article" onChange={(e) => { addArticle(Number(e.target.value)); }}>
                    {articles.map(a => <MenuItem key={a.id} value={a.id}>{a.designation} - {a.prix_unitaire.toFixed(2)} €</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField fullWidth multiline rows={3} label="Notes" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} />
              </CardContent></Card>
            </Box>

            <Card><CardContent>
              <Typography variant="h6" gutterBottom>Articles du Devis</Typography>
              {formData.articles.length === 0 ? (
                <Alert severity="info">Aucun article ajouté</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Désignation</TableCell>
                        <TableCell>Quantité</TableCell>
                        <TableCell>Prix U.</TableCell>
                        <TableCell>Total HT</TableCell>
                        <TableCell>TVA</TableCell>
                        <TableCell>Total TVA</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.articles.map((article, index) => (
                        <TableRow key={index}>
                          <TableCell>{article.designation}</TableCell>
                          <TableCell>
                            <TextField type="number" value={article.quantite}
                              onChange={(e) => updateArticleQuantity(index, parseInt(e.target.value) || 1)}
                              sx={{ width: 80 }} slotProps={{ htmlInput: { min: 1 } }} />
                          </TableCell>
                          <TableCell>{article.prix_unitaire.toFixed(2)} €</TableCell>
                          <TableCell>{article.total_ht.toFixed(2)} €</TableCell>
                          <TableCell>{article.tva}%</TableCell>
                          <TableCell>{article.total_tva.toFixed(2)} €</TableCell>
                          <TableCell>
                            <IconButton color="error" onClick={() => setFormData(p => ({ ...p, articles: p.articles.filter((_, i) => i !== index) }))}>
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent></Card>

            {formData.articles.length > 0 && (
              <Card><CardContent>
                <Typography variant="h6" gutterBottom>Récapitulatif</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                  <Typography>Total HT: <strong>{totaux.total_ht.toFixed(2)} €</strong></Typography>
                  <Typography>Total TVA: <strong>{totaux.total_tva.toFixed(2)} €</strong></Typography>
                  <Typography>Total TTC: <strong>{totaux.total_ttc.toFixed(2)} €</strong></Typography>
                </Box>
              </CardContent></Card>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={generatePDF} disabled={formData.articles.length === 0}>
                PDF
              </Button>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading || formData.articles.length === 0}>
                {loading ? <CircularProgress size={20} /> : 'Créer le Devis'}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </LocalizationProvider>
  );
};
