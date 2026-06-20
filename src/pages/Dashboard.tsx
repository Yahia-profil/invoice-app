import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Card, CardContent, List, ListItem,
  ListItemText, AppBar, Toolbar, IconButton, Menu, MenuItem, Avatar,
  useTheme, alpha, Fab, Zoom
} from '@mui/material';
import {
  PeopleAlt, Receipt, Description, Logout, Brightness4, Brightness7,
  TrendingUp, AttachMoney, Schedule, CheckCircle, Cancel, Add, Settings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { ClientList } from '../components/ClientList';
import { InvoiceList } from '../components/InvoiceList';
import { AdminPanel } from '../components/AdminPanel';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { CompanySettingsDialog } from '../components/CompanySettingsDialog';
import { QuoteList } from '../components/QuoteList';
import { quoteApi } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const Dashboard: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { clients, invoices } = useData();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeView, setActiveView] = useState<'overview' | 'clients' | 'invoices' | 'quotes' | 'admin'>('overview');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    quoteApi.list().then(setQuotes).catch(() => {});
  }, []);

  const stats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.statut === 'payee').length,
    pendingInvoices: invoices.filter(inv => ['soumise', 'validee_admin', 'en_attente_paiement'].includes(inv.statut)).length,
    rejectedInvoices: invoices.filter(inv => ['rejetee', 'rejetee_admin'].includes(inv.statut)).length,
    totalCollected: invoices.filter(inv => inv.statut === 'payee').reduce((sum, inv) => sum + inv.total_ttc, 0),
    averageInvoice: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.total_ttc, 0) / invoices.length : 0,
    totalQuotes: quotes.length,
  };

  const statusData = [
    { name: 'Payées', value: stats.paidInvoices, color: '#10b981' },
    { name: 'En cours', value: stats.pendingInvoices, color: '#f59e0b' },
    { name: 'Rejetées', value: stats.rejectedInvoices, color: '#ef4444' },
  ];

  const monthlyData = [
    { name: 'Jan', montant: 1200 },
    { name: 'Fév', montant: 1800 },
    { name: 'Mar', montant: 2400 },
    { name: 'Avr', montant: 1500 },
    { name: 'Mai', montant: 2100 },
  ];

  const menuItems = [
    { id: 'overview', label: 'Tableau de bord', icon: <Description /> },
    { id: 'clients', label: 'Clients', icon: <PeopleAlt /> },
    { id: 'invoices', label: 'Factures', icon: <Receipt /> },
    { id: 'quotes', label: 'Devis', icon: <Description /> },
    ...(isAdmin() ? [{ id: 'admin', label: 'Administration', icon: <Description /> }] : [])
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'clients': return <ClientList />;
      case 'invoices': return <InvoiceList />;
      case 'quotes': return <QuoteList />;
      case 'admin': return <AdminPanel />;
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 3 }}>
              {[
                { icon: <PeopleAlt sx={{ fontSize: 32, color: theme.palette.primary.main }} />, value: clients.length, label: 'Clients', sub: 'Total clients', color: theme.palette.primary.main },
                { icon: <Receipt sx={{ fontSize: 32, color: theme.palette.secondary.main }} />, value: stats.totalInvoices, label: 'Factures', sub: 'Total créées', color: theme.palette.secondary.main },
                { icon: <Description sx={{ fontSize: 32, color: '#9333ea' }} />, value: stats.totalQuotes, label: 'Devis', sub: 'Total créés', color: '#9333ea' },
                { icon: <Schedule sx={{ fontSize: 32, color: '#f59e0b' }} />, value: stats.pendingInvoices, label: 'En cours', sub: 'Factures en cours', color: '#f59e0b' },
                { icon: <CheckCircle sx={{ fontSize: 32, color: '#10b981' }} />, value: stats.paidInvoices, label: 'Payées', sub: 'Factures payées', color: '#10b981' },
              ].map((card, i) => (
                <Card key={i} sx={{ background: `linear-gradient(135deg, ${alpha(card.color, 0.1)} 0%, ${alpha(card.color, 0.05)} 100%)`, borderLeft: `4px solid ${card.color}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      {card.icon}
                      <AnimatedCounter value={card.value} variant="h4" color={card.color} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{card.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{card.sub}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Cancel sx={{ fontSize: 28, color: '#ef4444', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Rejetées</Typography>
                  </Box>
                  <AnimatedCounter value={stats.rejectedInvoices} variant="h4" color="#ef4444" />
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoney sx={{ fontSize: 28, color: '#10b981', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Encaissé</Typography>
                  </Box>
                  <AnimatedCounter value={stats.totalCollected} variant="h4" color="#10b981" decimals={2} suffix="€" />
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ fontSize: 28, color: theme.palette.primary.main, mr: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Moyenne</Typography>
                  </Box>
                  <AnimatedCounter value={stats.averageInvoice} variant="h4" color="primary" decimals={2} suffix="€" />
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Répartition des factures</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} dataKey="value">
                        {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Évolution mensuelle</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="montant" fill={theme.palette.primary.main} name="Montant (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Actions rapides</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="contained" startIcon={<PeopleAlt />}
                      onClick={() => setActiveView('clients')}>Ajouter un client</Button>
                    <Button variant="contained" color="secondary" startIcon={<Receipt />}
                      onClick={() => navigate('/invoice-form')}>Créer une facture</Button>
                    <Button variant="contained" color="success" startIcon={<Description />}
                      onClick={() => navigate('/quote-form')}>Créer un devis</Button>
                    <Button variant="outlined" startIcon={<Receipt />}
                      onClick={() => setActiveView('invoices')}>Voir les factures</Button>
                  </Box>
                </CardContent>
              </Card>
              <ActivityTimeline invoices={invoices} limit={5} />
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: 'primary.main' }}>
            Gestion des Factures
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {currentUser?.email?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
              sx={{ '& .MuiPaper-root': { mt: 1.5, minWidth: 200 } }}>
              <MenuItem disabled sx={{ opacity: 0.7 }}>{currentUser?.email}</MenuItem>
              <MenuItem onClick={async () => { setAnchorEl(null); await logout(); }}>
                <Logout sx={{ mr: 1 }} /> Déconnexion
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Paper sx={{ width: 260, mr: 2, borderRadius: 0, bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }} elevation={0}>
          <List sx={{ pt: 2, flex: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.id} sx={{
                cursor: 'pointer', mx: 1, borderRadius: 2, mb: 0.5,
                backgroundColor: activeView === item.id ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: activeView === item.id ? 'primary.main' : 'text.primary',
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
              }} onClick={() => setActiveView(item.id as any)}>
                {item.icon}
                <ListItemText primary={item.label} sx={{ ml: 2, '& .MuiTypography-root': { fontWeight: activeView === item.id ? 600 : 400 } }} />
              </ListItem>
            ))}
            <Box sx={{ mt: 'auto', borderTop: 1, borderColor: 'divider', pt: 1, mx: 1 }}>
              <ListItem sx={{ cursor: 'pointer', borderRadius: 2 }}
                onClick={() => setSettingsOpen(true)}>
                <Settings />
                <ListItemText primary="Paramètres" sx={{ ml: 2 }} />
              </ListItem>
            </Box>
          </List>
        </Paper>

        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>{renderContent()}</Box>
      </Box>

      <Zoom in={true} style={{ transitionDelay: '300ms' }}>
        <Fab color="primary" sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
          onClick={() => navigate('/invoice-form')}>
          <Add />
        </Fab>
      </Zoom>

      <CompanySettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
};
