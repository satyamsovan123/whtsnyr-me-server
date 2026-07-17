import { notFound, conflict } from "../../common/errors/app-error.js";
import { Alert } from "./alert.model.js";
import { getCurrentWeather } from "../weather/weather.service.js";

const severityOrder = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

async function getAlerts(query) {
  const filter = {
    active: true,
    validFrom: { $lte: new Date() },
    $or: [{ validUntil: null }, { validUntil: { $gt: new Date() } }],
  };

  if (query.areaId) filter.areaId = query.areaId;
  if (query.city) filter.city = query.city;

  const adminAlerts = await Alert.find(filter)
    .sort({ severity: 1, createdAt: -1 })
    .limit(query.limit)
    .lean();

  const formattedAdminAlerts = adminAlerts.map(alert => ({
    ...alert,
    source: 'admin'
  }));

  const allAlerts = [...formattedAdminAlerts];

  if (query.latitude !== undefined && query.longitude !== undefined) {
    const weatherData = await getCurrentWeather(query.latitude, query.longitude);
    if (weatherData && weatherData.available && weatherData.advisory && weatherData.advisory.length > 0) {
      const weatherAlerts = weatherData.advisory.map(adv => ({
        type: 'WEATHER',
        severity: 'INFO',
        title: 'Weather Advisory',
        summary: adv,
        source: 'weather',
        validFrom: new Date(),
      }));
      allAlerts.push(...weatherAlerts);
    }
  }

  allAlerts.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
    if (sevDiff !== 0) return sevDiff;
    const timeA = a.validFrom ? a.validFrom.getTime() : 0;
    const timeB = b.validFrom ? b.validFrom.getTime() : 0;
    return timeB - timeA;
  });

  return allAlerts.slice(0, query.limit);
}

async function createAlert(input, request) {
  const document = await Alert.create({
    ...input,
    createdBy: request.auth.userId,
  });
  return document;
}

async function listAdminAlerts(query) {
  const documents = await Alert.find({})
    .sort({ createdAt: -1 })
    .limit(query.limit || 25)
    .lean();
  return documents;
}

async function updateAlert(id, input) {
  const { expectedVersion, ...patch } = input;
  
  const document = await Alert.findOneAndUpdate(
    { _id: id, version: expectedVersion },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );

  if (!document) {
    if (await Alert.exists({ _id: id })) {
      throw conflict("VERSION_CONFLICT", "The resource changed; reload it before updating");
    }
    throw notFound("alert");
  }

  return document;
}

export { getAlerts, createAlert, listAdminAlerts, updateAlert };
