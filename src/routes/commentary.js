import {Router} from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get('/', async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        return res.status(400).json({
            error: 'Invalid match id',
            details: parsedParams.error.issues,
        });
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        return res.status(400).json({
            error: 'Invalid query',
            details: parsedQuery.error.issues,
        });
    }

    const limit = Math.min(parsedQuery.data.limit ?? 100, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, parsedParams.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        return res.json({ data });
    } catch (e) {
        console.error('Error fetching commentary:', e);
        return res.status(500).json({
            error: 'Failed to fetch commentary',
        });
    }
});

commentaryRouter.post('/', async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
        return res.status(400).json({
            error: 'Invalid match id',
            details: parsedParams.error.issues,
        });
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            error: 'Invalid payload',
            details: parsedBody.error.issues,
        });
    }

    const {
        minutes,
        sequence,
        period,
        eventType,
        actor,
        team,
        message,
        metadata,
        tags,
    } = parsedBody.data;

    try {
        const [row] = await db
            .insert(commentary)
            .values({
                matchId: parsedParams.data.id,
                minute: minutes ?? null,
                sequence,
                period: period !== undefined && period !== null ? Number(period) : null,
                eventType,
                actor,
                team,
                message,
                metadata: metadata ?? null,
                tags: tags ?? null,
            })
            .returning();

            if(res.app.locals.broadcastCommentary) {
                res.app.locals.broadcastCommentary(row.matchId, row);
            }

        return res.status(201).json({ data: row });
    } catch (e) {
        console.error('Error creating commentary:', e);
        return res.status(500).json({
            error: 'Failed to create commentary',
        });
    }
});