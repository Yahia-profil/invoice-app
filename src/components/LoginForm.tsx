import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
  Box, Paper, TextField, Button, Typography, Tabs, Tab,
  Container, Avatar, useTheme, alpha, CircularProgress
} from '@mui/material';
import { LockOutlined, PersonAddOutlined, LoginOutlined } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const LoginForm: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { darkMode } = useCustomTheme();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie!');
    } catch (err: any) {
      toast.error('Échec de connexion: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }
    if (!nom.trim()) {
      toast.error('Veuillez entrer votre nom');
      setLoading(false);
      return;
    }
    try {
      await register(email, password, nom);
      toast.success('Compte créé avec succès!');
    } catch (err: any) {
      toast.error('Échec de création: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <Paper elevation={0} sx={{
          width: '100%', maxWidth: 450, p: 4, borderRadius: 3,
          background: darkMode ? alpha(theme.palette.background.paper, 0.8) : alpha('#ffffff', 0.95),
          backdropFilter: 'blur(10px)', border: darkMode ? 1 : 0, borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              {tabValue === 0 ? <LockOutlined /> : <PersonAddOutlined />}
            </Avatar>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mt: 2 }}>
              {tabValue === 0 ? 'Connexion' : 'Inscription'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {tabValue === 0 ? 'Connectez-vous à votre compte' : 'Créez votre compte pour commencer'}
            </Typography>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered
              sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
              <Tab label="Connexion" />
              <Tab label="Inscription" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin}>
              <TextField margin="normal" required fullWidth label="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              <TextField margin="normal" required fullWidth label="Mot de passe" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              <Button type="submit" fullWidth variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <LoginOutlined />}
                sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegister}>
              <TextField margin="normal" required fullWidth label="Nom" value={nom}
                onChange={(e) => setNom(e.target.value)} disabled={loading} />
              <TextField margin="normal" required fullWidth label="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              <TextField margin="normal" required fullWidth label="Mot de passe" type="password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading} helperText="Minimum 6 caractères" />
              <TextField margin="normal" required fullWidth label="Confirmer le mot de passe" type="password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
              <Button type="submit" fullWidth variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAddOutlined />}
                sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={loading}>
                {loading ? 'Inscription...' : "S'inscrire"}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};
