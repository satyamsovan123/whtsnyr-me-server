import { Router } from 'express';
import { getInsights, chatInsights } from './insights.controller.js';
import { optionalAuthenticate } from '../../common/middleware/auth.js';
import { validate } from '../../common/middleware/validate.js';
import { z } from 'zod';

const generateInsightsSchema = z.object({
  body: z.object({
    weatherData: z.any().optional(),
    placesData: z.any().optional(),
    swiggyData: z.any().optional()
  })
});

const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(500),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    history: z.array(z.any()).default([]),
    language: z.string().optional()
  })
});

const router = Router();

// Endpoint doesn't require auth by default since it's an open dashboard, 
// but we add schema validation
router.post('/generate', validate(generateInsightsSchema), getInsights);
router.post('/chat', optionalAuthenticate, validate(chatSchema), chatInsights);

export { router as insightsRouter };
