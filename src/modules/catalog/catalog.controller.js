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

/** Lists public catalog entries for a resource type. */
async function publicList(request, response) {
  const result = await listPublic(request.catalogResource, request.validated.query);
  return sendData(response, result.documents, { meta: result.meta });
}

/** Returns one public catalog entry by id. */
async function publicGet(request, response) {
  return sendData(response, await getPublic(request.catalogResource, request.validated.params.id));
}

/** Resolves an area from free text or coordinates. */
async function areaResolve(request, response) {
  return sendData(response, await resolveArea(request.validated.body));
}

/** Lists catalog entries for admin/curator workflows. */
async function adminList(request, response) {
  const result = await listAdmin(request.catalogResource, request.validated.query);
  return sendData(response, result.documents, { meta: result.meta });
}

/** Returns one catalog entry for admin/curator workflows. */
async function adminGet(request, response) {
  return sendData(response, await getAdmin(request.catalogResource, request.validated.params.id));
}

/** Creates a catalog entry for a resource type. */
async function adminCreate(request, response) {
  const document = await createCatalogResource(
    request.catalogResource,
    request.validated.body,
    request,
  );
  return sendData(response, document, { status: 201 });
}

/** Updates a catalog entry using optimistic concurrency controls. */
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

/** Publishes a catalog entry. */
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

/** Archives a catalog entry. */
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
