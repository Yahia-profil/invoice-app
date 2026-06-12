import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const invoiceArticleSchema = z.object({
  article_id: z.number().int().positive(),
  designation: z.string(),
  quantite: z.number().int().positive(),
  prix_unitaire: z.number().positive(),
  remise: z.number().min(0).default(0),
  total_ligne: z.number(),
  categorie_id: z.number().int(),
  tva: z.number().default(0),
});

const invoiceSchema = z.object({
  numero: z.string().min(1),
  client_id: z.string().min(1),
  total_ht: z.number(),
  tva: z.number(),
  total_ttc: z.number(),
  statut: z.string().default('brouillon'),
  type_virement: z.string().optional(),
  notes: z.string().optional(),
  articles: z.array(invoiceArticleSchema).min(1),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
  brouillon: ['soumise', 'rejetee'],
  soumise: ['validee_admin', 'rejetee_admin'],
  validee_admin: ['signee', 'rejetee'],
  en_attente_signature: ['signee', 'rejetee'],
  signee: ['en_attente_paiement', 'rejetee'],
  en_attente_paiement: ['payee', 'rejetee'],
  payee: [],
  rejetee: [],
  rejetee_admin: ['brouillon'],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

async function createAuditLog(
  invoiceId: string, action: string, userId: string,
  oldStatut?: string, newStatut?: string, details?: string
) {
  await prisma.auditLog.create({
    data: { invoice_id: invoiceId, action, old_statut: oldStatut, new_statut: newStatut, user_id: userId, details },
  });
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const where = isAdmin ? {} : { user_id: req.userId };

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      articles: true,
      client: true,
      signature: true,
      audit_logs: { orderBy: { created_at: 'desc' }, take: 5 },
    },
    orderBy: { created_at: 'desc' },
  });
  res.json(invoices);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.user_id = req.userId;

  const invoice = await prisma.invoice.findFirst({
    where,
    include: {
      articles: true,
      client: true,
      signature: true,
      audit_logs: { orderBy: { created_at: 'desc' } },
    },
  });
  if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
  res.json(invoice);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: {
        numero: data.numero,
        client_id: data.client_id,
        total_ht: data.total_ht,
        tva: data.tva,
        total_ttc: data.total_ttc,
        statut: data.statut,
        type_virement: data.type_virement,
        notes: data.notes,
        user_id: req.userId!,
        articles: {
          create: data.articles.map(a => ({
            article_id: a.article_id,
            designation: a.designation,
            quantite: a.quantite,
            prix_unitaire: a.prix_unitaire,
            remise: a.remise,
            total_ligne: a.total_ligne,
            categorie_id: a.categorie_id,
            tva: a.tva,
          })),
        },
      },
      include: { articles: true, client: true },
    });
    await createAuditLog(invoice.id, 'created', req.userId!, undefined, data.statut);
    res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, user_id: req.userId },
    });
    if (!existing) { res.status(404).json({ error: 'Invoice not found' }); return; }
    if (existing.statut !== 'brouillon') {
      res.status(400).json({ error: 'Can only edit invoices in draft status' });
      return;
    }
    const data = invoiceSchema.partial().parse(req.body);
    await prisma.invoiceArticle.deleteMany({ where: { invoice_id: req.params.id } });
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...data,
        articles: data.articles ? {
          create: data.articles.map(a => ({
            article_id: a.article_id,
            designation: a.designation,
            quantite: a.quantite,
            prix_unitaire: a.prix_unitaire,
            remise: a.remise,
            total_ligne: a.total_ligne,
            categorie_id: a.categorie_id,
            tva: a.tva,
          })),
        } : undefined,
      },
      include: { articles: true, client: true },
    });
    await createAuditLog(updated.id, 'updated', req.userId!, existing.statut, updated.statut);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { statut } = z.object({ statut: z.string().min(1) }).parse(req.body);
    const isAdmin = req.userRole === 'admin';

    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id } });
    if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
    if (!canTransition(invoice.statut, statut)) {
      res.status(400).json({ error: `Cannot transition from '${invoice.statut}' to '${statut}'` });
      return;
    }
    if ((statut === 'validee_admin' || statut === 'rejetee_admin' || statut === 'signee') && !isAdmin) {
      res.status(403).json({ error: 'Only admins can perform this action' });
      return;
    }

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        statut,
        validated_by_admin: statut === 'validee_admin' ? true : undefined,
        validated_by_client: statut === 'signee' ? true : undefined,
      },
      include: { articles: true, client: true, signature: true },
    });
    await createAuditLog(updated.id, `status_change:${statut}`, req.userId!, invoice.statut, statut);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const where: any = { id: req.params.id };
  if (!isAdmin) where.user_id = req.userId;

  const existing = await prisma.invoice.findFirst({ where });
  if (!existing) { res.status(404).json({ error: 'Invoice not found' }); return; }
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.get('/admin/pending', adminOnly, async (_req: AuthRequest, res: Response) => {
  const pending = await prisma.invoice.findMany({
    where: { statut: 'soumise' },
    include: {
      articles: true,
      client: true,
      user: { select: { id: true, nom: true, email: true } },
    },
    orderBy: { created_at: 'asc' },
  });
  res.json(pending);
});

router.get('/:id/audit', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const where: any = { invoice_id: req.params.id };
  if (!isAdmin) where.invoice = { user_id: req.userId };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
  res.json(logs);
});

export default router;
