import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendData } from '../../common/utils/api-response.js';
import { generateInsights } from './insights.service.js';

export const getInsights = asyncHandler(async (req, res) => {
  const { weatherData, placesData, swiggyData } = req.body;
  
  const result = await generateInsights({
    weatherData,
    placesData,
    swiggyData
  });

  return sendData(res, result);
});
