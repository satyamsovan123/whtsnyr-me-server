import { sendData } from "../../common/utils/api-response.js";
import { getCurrentWeather } from "./weather.service.js";

async function getWeather(request, response) {
  const { latitude, longitude } = request.validated.query;
  const data = await getCurrentWeather(latitude, longitude);
  return sendData(response, data);
}

export { getWeather };
