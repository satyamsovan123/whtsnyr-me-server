import { GoogleGenAI } from '@google/genai';
import { getConfig } from '../../config/env.js';
import { createLogger } from '../../config/logger.js';

const logger = createLogger();

let ai;

function getAIClient() {
  if (!ai) {
    const config = getConfig();
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return ai;
}

/**
 * Generate highly personalized local insights using Gemini.
 * @param {Object} context
 * @param {Object} context.weatherData
 * @param {Object} context.placesData
 * @param {Object} context.swiggyData
 */
export async function generateInsights(context) {
  try {
    const aiClient = getAIClient();
    
    const prompt = `You are a highly localized AI Concierge. 
    Analyze the following current data for the user's location and provide a single, engaging paragraph (2-3 sentences max) of personalized insight or recommendation. 
    Focus on blending the current weather, interesting nearby places, and potential food/shopping options.
    Be friendly, concise, and helpful. Do not use asterisks or markdown bolding. Just plain text.
    
    Context Data:
    Weather: ${JSON.stringify(context.weatherData || {})}
    Nearby Places: ${JSON.stringify(context.placesData || [])}
    Food Options: ${JSON.stringify(context.swiggyData || [])}`;

    const response = await aiClient.models.generateContent({
      model: getConfig().GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return {
      insight: response.text
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate Gemini insights');
    throw error;
  }
}
