import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendData } from '../../common/utils/api-response.js';
import { generateInsights, generateChatResponse } from './insights.service.js';

export const getInsights = asyncHandler(async (req, res) => {
  const { weatherData, placesData, swiggyData } = req.body;
  
  const result = await generateInsights({
    weatherData,
    placesData,
    swiggyData
  });

  return sendData(res, result);
});

export const chatInsights = asyncHandler(async (req, res) => {
  const { message, latitude, longitude, history, language } = req.body;
  const result = await generateChatResponse({ message, latitude, longitude, history, language, userId: req.auth?.userId });
  return sendData(res, result);
});
