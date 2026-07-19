import { GoogleGenAI } from '@google/genai';
import { getConfig } from '../../config/env.js';
import { createLogger } from '../../config/logger.js';
import { swiggyFoodTools } from './swiggy-gemini-tools.js';
import { callSwiggyReadTool, callSwiggyWriteTool } from '../providers/swiggy-mcp.service.js';
import { AppError } from '../../common/errors/app-error.js';

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
    
    let reason = "We couldn't generate AI insights for this location right now.";
    if (error.message && error.message.includes('API_KEY')) {
      reason = "AI insights are unavailable because the API key is missing.";
    } else if (error.status === 429 || error.message?.includes('429')) {
      reason = "The AI service is currently busy. Please try again in a moment.";
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      reason = "A network issue prevented us from getting your insights.";
    }
    
    return {
      insight: null,
      errorReason: reason
    };
  }
}

/**
 * Use Gemini to determine authentic local food and product search queries
 * based on the user's coordinates. This ensures we search Swiggy for
 * genuinely local dishes (e.g., Dalma in Odisha, not momos).
 */
export async function getLocalSpecialtyQueries(latitude, longitude) {
  try {
    const aiClient = getAIClient();

    const prompt = `You are a food and culture expert for India. Given coordinates ${latitude}, ${longitude}, determine the city/region and return ONLY authentic local specialties.

Rules:
- Only return food and products that are GENUINELY native/authentic to this specific region
- Do NOT include generic pan-Indian food (biryani, pizza, momos, etc.) unless they are truly the specialty of this region
- For example: Odisha → Dalma, Chhena Poda, Pakhala, Rasagola; Kolkata → Kathi Roll, Mishti Doi, Rasgulla; Hyderabad → Hyderabadi Biryani, Haleem
- foodQueries: 2 search terms for restaurants serving authentic local cuisine
- productQueries: 2 search terms for local sweets, snacks, or regional products available on a grocery app

Return ONLY valid JSON, no markdown.`;

    const responseSchema = {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The city/region name' },
        foodQueries: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search terms for authentic local restaurants/food'
        },
        productQueries: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search terms for authentic local sweets/snacks/products'
        }
      },
      required: ['region', 'foodQueries', 'productQueries']
    };

    const response = await aiClient.models.generateContent({
      model: getConfig().GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    const parsed = JSON.parse(response.text);
    logger.info({ region: parsed.region, foodQueries: parsed.foodQueries, productQueries: parsed.productQueries }, 'Gemini local specialty queries');
    return parsed;
  } catch (error) {
    logger.error({ err: error }, 'Failed to get local specialty queries from Gemini');
    return { region: 'Unknown', foodQueries: ['local thali', 'regional cuisine'], productQueries: ['local sweets', 'regional snacks'] };
  }
}

/**
 * Handle interactive AI Chat using structured output.
 */
export async function generateChatResponse({ message, latitude, longitude, history, language, userId }) {
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
    
    let sysPrompt = `You are a helpful local AI Concierge and Swiggy Food Ordering Assistant.
    Answer the user's questions about the local area. If they ask for food, cafes, or specific places, you can generate a place card by setting showCard=true and providing cardData.
    Be conversational, concise, and friendly. Do not use asterisks or markdown bolding.
    IMPORTANT: You have the ability to order food on Swiggy for the user using tools. You can also fetch their past orders and find local specialties on Instamart and Food.
    The rules for ordering food:
    1. ALWAYS resolve the user's saved address via get_addresses before searching. Ask them to add an address if none exist.
    2. Only recommend restaurants with availabilityStatus: "OPEN".
    3. Confirm the cart and total with the user before calling place_food_order.
    4. Only COD is supported in v1; filter coupons to those not requiring online payment.
    5. Never exceed ₹1000 cart total.
    If place_food_order fails with 5xx, call track_food_order or get_food_orders to check if it actually placed.
    CRITICAL: You MUST respond to the user entirely in the ${targetLang} language.`;
    
    if (latitude && longitude) {
      sysPrompt += `\nThe user is currently at coordinates: ${latitude}, ${longitude}.`;
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

    const config = {
      systemInstruction: sysPrompt,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      tools: userId ? [{ functionDeclarations: swiggyFoodTools }] : undefined
    };

    let response = await aiClient.models.generateContent({
      model: getConfig().GEMINI_MODEL,
      contents: formattedHistory,
      config
    });

    while (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      let result;
      try {
        let server = 'food';
        if (['search_products', 'get_orders'].includes(call.name)) {
          server = 'instamart';
        }
        
        if (['update_food_cart', 'apply_food_coupon', 'place_food_order'].includes(call.name)) {
          result = await callSwiggyWriteTool(userId, server, call.name, call.args);
        } else {
          result = await callSwiggyReadTool(userId, server, call.name, call.args);
        }
      } catch (e) {
        logger.error({ err: e }, `Failed to execute tool ${call.name}`);
        result = { error: e.message || 'Tool execution failed' };
      }
      
      formattedHistory.push(response.candidates[0].content);
      formattedHistory.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: call.name,
            response: result
          }
        }]
      });

      response = await aiClient.models.generateContent({
        model: getConfig().GEMINI_MODEL,
        contents: formattedHistory,
        config
      });
    }

    return JSON.parse(response.text);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate chat response');
    throw new AppError({
      status: error.status === 429 ? 429 : 503,
      code: error.status === 429 ? 'AI_RATE_LIMIT' : 'AI_SERVICE_UNAVAILABLE',
      message: 'The AI service is currently busy or unavailable. Please try again in a moment.',
    });
  }
}
