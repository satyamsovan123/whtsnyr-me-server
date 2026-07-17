import { sendData } from "../../common/utils/api-response.js";
import {
  archiveCatalogResource,
  createCatalogResource,
  getAdmin,
  getPublic,
  listAdmin,
  listPublic,
  publishCatalogResource,
  resolveArea,
  updateCatalogResource,
} from "./catalog.service.js";

async function publicList(request, response) {
  const result = await listPublic(request.catalogResource, request.validated.query);
  return sendData(response, result.documents, { meta: result.meta });
}

async function publicGet(request, response) {
  return sendData(response, await getPublic(request.catalogResource, request.validated.params.id));
}

async function areaResolve(request, response) {
  return sendData(response, await resolveArea(request.validated.body));
}

async function adminList(request, response) {
  const result = await listAdmin(request.catalogResource, request.validated.query);
  return sendData(response, result.documents, { meta: result.meta });
}

async function adminGet(request, response) {
  return sendData(response, await getAdmin(request.catalogResource, request.validated.params.id));
}

async function adminCreate(request, response) {
  const document = await createCatalogResource(
    request.catalogResource,
    request.validated.body,
    request,
  );
  return sendData(response, document, { status: 201 });
}

async function adminUpdate(request, response) {
  return sendData(
    response,
    await updateCatalogResource(
      request.catalogResource,
      request.validated.params.id,
      request.validated.body,
      request,
    ),
  );
}

async function adminPublish(request, response) {
  return sendData(
    response,
    await publishCatalogResource(
      request.catalogResource,
      request.validated.params.id,
      request.validated.body.expectedVersion,
      request,
    ),
  );
}

async function adminArchive(request, response) {
  return sendData(
    response,
    await archiveCatalogResource(
      request.catalogResource,
      request.validated.params.id,
      request.validated.body.expectedVersion,
      request,
    ),
  );
}

export {
  publicList,
  publicGet,
  areaResolve,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminPublish,
  adminArchive,
};
