import { getConfig } from "../../config/env.js";

const weatherCache = new Map();

function getWmoDescription(code) {
  if (code === 0) return "Clear sky";
  if (code >= 1 && code <= 3) return "Partly cloudy";
  if (code >= 45 && code <= 48) return "Fog";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rain";
  if (code >= 71 && code <= 75) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Unknown";
}

function generateAdvisories(current) {
  const advisories = [];
  if (current.precipitation > 0) advisories.push("Carry umbrella 🌧️");
  if (current.uvIndex > 6) advisories.push("Apply sunscreen ☀️");
  if (current.temperature > 35) advisories.push("Stay hydrated, carry water 💧");
  if (current.temperature < 15) advisories.push("Carry a light jacket 🧥");
  if (current.humidity > 80) advisories.push("High humidity, wear breathable clothing 🌫️");
  if (current.windSpeed > 30) advisories.push("Strong winds expected 🌬️");
  return advisories;
}

function calculatePhotoTip(daily) {
  if (!daily || !daily.length) return null;
  const today = daily[0];
  if (!today.sunrise || !today.sunset) return null;
  
  const sunriseTime = new Date(today.sunrise);
  const sunsetTime = new Date(today.sunset);
  
  const morningGoldenHourStart = new Date(sunriseTime.getTime() - 15 * 60000);
  const morningGoldenHourEnd = new Date(sunriseTime.getTime() + 45 * 60000);
  
  const eveningGoldenHourStart = new Date(sunsetTime.getTime() - 45 * 60000);
  const eveningGoldenHourEnd = new Date(sunsetTime.getTime() + 15 * 60000);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return `Golden hours today: ${formatTime(morningGoldenHourStart)}-${formatTime(morningGoldenHourEnd)} and ${formatTime(eveningGoldenHourStart)}-${formatTime(eveningGoldenHourEnd)}`;
}

async function getCurrentWeather(lat, lng) {
  // Round to 2 decimal places for cache key (~1.1km resolution)
  const roundLat = Math.round(lat * 100) / 100;
  const roundLng = Math.round(lng * 100) / 100;
  const cacheKey = `${roundLat},${roundLng}`;

  const cached = weatherCache.get(cacheKey);
  const config = getConfig();
  
  if (cached && (Date.now() - cached.timestamp < config.weather.cacheTtlMs)) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    const data = await response.json();

    const current = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      feelsLike: data.current.apparent_temperature,
      weatherCode: data.current.weather_code,
      description: getWmoDescription(data.current.weather_code),
      // UV index isn't available in current, grab from daily max today
      uvIndex: data.daily.uv_index_max[0] || 0,
    };

    const daily = data.daily.time.map((dateStr, i) => ({
      date: dateStr,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitationSum: data.daily.precipitation_sum[i],
      uvIndexMax: data.daily.uv_index_max[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      weatherCode: data.daily.weather_code[i],
      description: getWmoDescription(data.daily.weather_code[i]),
    }));

    const result = {
      available: true,
      current,
      daily,
      advisory: generateAdvisories(current),
      photoTip: calculatePhotoTip(daily),
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return { available: false, error: 'Weather temporarily unavailable' };
  }
}

export { getCurrentWeather };
