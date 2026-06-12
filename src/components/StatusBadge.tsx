import React from 'react';
import { Box, Chip, alpha } from '@mui/material';
import {
  Schedule as PendingIcon,
  CheckCircle as PaidIcon,
  Cancel as RejectedIcon,
  Edit as DraftIcon,
  Send as SubmittedIcon,
  VerifiedUser as AdminValidIcon,
  TouchApp as SignPendingIcon,
  VerifiedUser as SignedIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

type InvoiceStatus = string;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; pulse?: boolean }> = {
  brouillon: { label: 'Brouillon', color: '#6b7280', icon: DraftIcon },
  soumise: { label: 'Soumise', color: '#3b82f6', icon: SubmittedIcon, pulse: true },
  validee_admin: { label: 'Validée Admin', color: '#8b5cf6', icon: AdminValidIcon },
  en_attente_signature: { label: 'En attente signature', color: '#f59e0b', icon: SignPendingIcon, pulse: true },
  signee: { label: 'Signée', color: '#10b981', icon: SignedIcon },
  en_attente_paiement: { label: 'En attente paiement', color: '#f97316', icon: PaymentIcon },
  payee: { label: 'Payée', color: '#10b981', icon: PaidIcon },
  rejetee: { label: 'Rejetée', color: '#ef4444', icon: RejectedIcon },
  rejetee_admin: { label: 'Rejetée Admin', color: '#dc2626', icon: RejectedIcon },
};

interface StatusBadgeProps {
  status: InvoiceStatus;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'filled',
  size = 'medium'
}) => {
  const config = statusConfig[status] || { label: status, color: '#6b7280', icon: PendingIcon };
  const Icon = config.icon;

  const pulseSx = config.pulse ? {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { boxShadow: `0 0 0 0 ${alpha(config.color, 0.4)}` },
      '70%': { boxShadow: `0 0 0 6px ${alpha(config.color, 0)}` },
      '100%': { boxShadow: `0 0 0 0 ${alpha(config.color, 0)}` }
    }
  } : {};

  if (variant === 'outlined') {
    return (
      <Chip
        icon={<Icon fontSize="small" />}
        label={config.label}
        size={size}
        sx={{
          borderColor: config.color,
          color: config.color,
          backgroundColor: alpha(config.color, 0.1),
          fontWeight: 600,
          '& .MuiChip-icon': { color: config.color },
          ...pulseSx
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: alpha(config.color, 0.1),
        color: config.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        border: `1px solid ${alpha(config.color, 0.2)}`,
        ...pulseSx
      }}
    >
      <Icon fontSize={size === 'small' ? 'small' : 'medium'} />
      {config.label}
    </Box>
  );
};
