import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const quoteArticleSchema = z.object({
  article_id: z.number().int().positive(),
  designation: z.string(),
  quantite: z.number().int().positive(),
  prix_unitaire: z.number().positive(),
  categorie_nom: z.string(),
  tva: z.number(),
  total_ht: z.number(),
  total_tva: z.number(),
});

const quoteSchema = z.object({
  numero_devis: z.string().min(1),
  client_nom: z.string().min(1),
  client_email: z.string().email(),
  client_id: z.string().min(1),
  date_validite: z.string(),
  statut: z.string().default('envoye'),
  total_ht: z.number(),
  total_tva: z.number(),
  total_ttc: z.number(),
  notes: z.string().optional(),
  articles: z.array(quoteArticleSchema).min(1),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const quotes = await prisma.quote.findMany({
    where: { user_id: req.userId },
    include: { articles: true },
    orderBy: { created_at: 'desc' },
  });
  res.json(quotes);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const quote = await prisma.quote.findFirst({
    where: { id: req.params.id, user_id: req.userId },
    include: { articles: true },
  });
  if (!quote) { res.status(404).json({ error: 'Quote not found' }); return; }
  res.json(quote);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = quoteSchema.parse(req.body);
    const quote = await prisma.quote.create({
      data: {
        numero_devis: data.numero_devis,
        client_nom: data.client_nom,
        client_email: data.client_email,
        client_id: data.client_id,
        date_validite: new Date(data.date_validite),
        statut: data.statut,
        total_ht: data.total_ht,
        total_tva: data.total_tva,
        total_ttc: data.total_ttc,
        notes: data.notes,
        user_id: req.userId!,
        articles: {
          create: data.articles.map(a => ({
            article_id: a.article_id,
            designation: a.designation,
            quantite: a.quantite,
            prix_unitaire: a.prix_unitaire,
            categorie_nom: a.categorie_nom,
            tva: a.tva,
            total_ht: a.total_ht,
            total_tva: a.total_tva,
          })),
        },
      },
      include: { articles: true },
    });
    res.status(201).json(quote);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.quote.findFirst({ where: { id: req.params.id, user_id: req.userId } });
    if (!existing) { res.status(404).json({ error: 'Quote not found' }); return; }

    const data = quoteSchema.partial().parse(req.body);
    await prisma.quoteArticle.deleteMany({ where: { quote_id: req.params.id } });

    const updated = await prisma.quote.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date_validite: data.date_validite ? new Date(data.date_validite) : undefined,
        articles: data.articles ? {
          create: data.articles.map(a => ({
            article_id: a.article_id,
            designation: a.designation,
            quantite: a.quantite,
            prix_unitaire: a.prix_unitaire,
            categorie_nom: a.categorie_nom,
            tva: a.tva,
            total_ht: a.total_ht,
            total_tva: a.total_tva,
          })),
        } : undefined,
      },
      include: { articles: true },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.quote.findFirst({ where: { id: req.params.id, user_id: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Quote not found' }); return; }
  await prisma.quote.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
