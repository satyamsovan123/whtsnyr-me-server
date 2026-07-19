import { sendData } from "../../common/utils/api-response.js";
import { callSwiggyReadTool } from "../providers/swiggy-mcp.service.js";
import {
  archiveSpecialty,
  createSpecialty,
  getAdmin,
  getPublic,
  listAdmin,
  listPublic,
  publishSpecialty,
  updateSpecialty,
} from "./specialty.service.js";

async function publicList(request, response) {
  return sendData(response, await listPublic(request.validated.query, request.auth?.userId));
}

async function publicGet(request, response) {
  return sendData(response, await getPublic(request.validated.params.id));
}

async function adminList(request, response) {
  return sendData(response, await listAdmin(request.validated.query));
}

async function adminGet(request, response) {
  return sendData(response, await getAdmin(request.validated.params.id));
}

async function adminCreate(request, response) {
  return sendData(response, await createSpecialty(request.validated.body, request), {
    status: 201,
  });
}

async function adminUpdate(request, response) {
  return sendData(
    response,
    await updateSpecialty(request.validated.params.id, request.validated.body, request),
  );
}

async function adminPublish(request, response) {
  return sendData(
    response,
    await publishSpecialty(
      request.validated.params.id,
      request.validated.body.expectedVersion,
      request,
    ),
  );
}

async function adminArchive(request, response) {
  return sendData(
    response,
    await archiveSpecialty(
      request.validated.params.id,
      request.validated.body.expectedVersion,
      request,
    ),
  );
}

async function findOnSwiggy(request, response) {
  const specialty = await getPublic(request.validated.params.id);
  if (!specialty.swiggySearchQuery) {
    return sendData(response, { available: false, reason: 'No Swiggy search query configured' });
  }
  const server = request.validated.query.server || 'food';
  const tool = server === 'instamart' ? 'search_products' : 'search_menu';
  const data = await callSwiggyReadTool(request.auth.userId, server, tool, {
    addressId: request.validated.query.addressId,
    query: specialty.swiggySearchQuery,
  });
  return sendData(response, { available: true, specialty: { name: specialty.name, category: specialty.category }, results: data });
}

export {
  publicList,
  publicGet,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminPublish,
  adminArchive,
  findOnSwiggy,
};
