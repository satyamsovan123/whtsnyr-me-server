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

/**
 * Handle interactive AI Chat using structured output.
 */
export async function generateChatResponse({ message, latitude, longitude, history, language }) {
  try {
    const aiClient = getAIClient();
    
    const langMap = {
      en: 'English',
      hi: 'Hindi',
      bn: 'Bengali',
      ta: 'Tamil',
      te: 'Telugu',
      gj: 'Gujarati',
      od: 'Odia'
    };
    
    const targetLang = language && langMap[language] ? langMap[language] : 'English';
    
    let sysPrompt = `You are a helpful local AI Concierge.
    Answer the user's questions about the local area. If they ask for food, cafes, or specific places, you can generate a place card by setting showCard=true and providing cardData.
    Be conversational, concise, and friendly. Do not use asterisks or markdown bolding.
    CRITICAL: You MUST respond to the user entirely in the ${targetLang} language.`;
    
    if (latitude && longitude) {
      sysPrompt += `\nThe user is currently at coordinates: ${latitude}, ${longitude}. You can pretend to know what's nearby or invent a realistic-sounding local place for the demo if you don't have live tools yet.`;
    }

    const responseSchema = {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The conversational response to the user.' },
        showCard: { type: 'boolean', description: 'True if you want to display a rich place card.' },
        cardData: {
          type: 'object',
          nullable: true,
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            distance: { type: 'string', description: 'e.g. "1.2 km"' },
            rating: { type: 'string', description: 'e.g. "4.5"' },
            isOpen: { type: 'boolean' },
            imageUrl: { type: 'string', description: 'Unsplash image URL' },
            swiggyLink: { type: 'string', nullable: true },
            mapLink: { type: 'string', nullable: true }
          }
        }
      },
      required: ['text', 'showCard']
    };

    const formattedHistory = (history || []).map(h => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    
    formattedHistory.push({ role: 'user', parts: [{ text: message }] });

    const response = await aiClient.models.generateContent({
      model: getConfig().GEMINI_MODEL,
      contents: formattedHistory,
      config: {
        systemInstruction: sysPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate chat response');
    throw error;
  }
}
