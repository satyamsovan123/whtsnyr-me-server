import { sendData } from "../../common/utils/api-response.js";
import { getAlerts, createAlert, listAdminAlerts, updateAlert } from "./alerts.service.js";

async function publicListAlerts(request, response) {
  const alerts = await getAlerts(request.validated.query);
  return sendData(response, alerts);
}

async function adminCreateAlert(request, response) {
  const alert = await createAlert(request.validated.body, request);
  return sendData(response, alert, { status: 201 });
}

async function adminListAlerts(request, response) {
  const alerts = await listAdminAlerts(request.validated.query);
  return sendData(response, alerts);
}

async function adminUpdateAlert(request, response) {
  const alert = await updateAlert(request.validated.params.id, request.validated.body);
  return sendData(response, alert);
}

export { publicListAlerts, adminCreateAlert, adminListAlerts, adminUpdateAlert };
