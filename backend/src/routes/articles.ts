import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const articleSchema = z.object({
  designation: z.string().min(1),
  prix_unitaire: z.number().positive(),
  categorie_id: z.number().int().positive(),
});

router.get('/', async (_req: AuthRequest, res: Response) => {
  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { id: 'asc' },
  });
  res.json(articles);
});

router.post('/', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = articleSchema.parse(req.body);
    const article = await prisma.article.create({ data, include: { category: true } });
    res.status(201).json(article);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = articleSchema.partial().parse(req.body);
    const article = await prisma.article.update({
      where: { id: Number(req.params.id) },
      data,
      include: { category: true },
    });
    res.json(article);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  await prisma.article.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
