import { Router } from 'express';
import { getInsights } from './insights.controller.js';
import validate from '../../common/middleware/validate.js';
import { z } from 'zod';

const generateInsightsSchema = z.object({
  body: z.object({
    weatherData: z.any().optional(),
    placesData: z.any().optional(),
    swiggyData: z.any().optional()
  })
});

const router = Router();

// Endpoint doesn't require auth by default since it's an open dashboard, 
// but we add schema validation
router.post('/generate', validate(generateInsightsSchema), getInsights);

export { router as insightsRouter };
