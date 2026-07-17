import { Router } from "express";

import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  adminArchive,
  adminCreate,
  adminGet,
  adminList,
  adminPublish,
  adminUpdate,
  areaResolve,
  publicGet,
  publicList,
} from "./catalog.controller.js";
import {
  adminListSchema,
  catalogIdSchema,
  createSchemas,
  publicListSchema,
  resolveAreaSchema,
  transitionSchema,
  updateSchemas,
} from "./catalog.schemas.js";

function resource(name) {
  return (request, _response, next) => {
    request.catalogResource = name;
    next();
  };
}

const catalogRouter = Router();
catalogRouter.post("/areas/resolve", validate(resolveAreaSchema), asyncHandler(areaResolve));
for (const name of ["areas", "places", "events", "merchants"]) {
  catalogRouter.get(
    `/${name}`,
    resource(name),
    validate(publicListSchema),
    asyncHandler(publicList),
  );
  catalogRouter.get(
    `/${name}/:id`,
    resource(name),
    validate(catalogIdSchema),
    asyncHandler(publicGet),
  );
}

const adminCatalogRouter = Router();
adminCatalogRouter.use(authenticate);
for (const name of ["areas", "places", "events", "merchants"]) {
  adminCatalogRouter.get(
    `/${name}`,
    authorize("CURATOR", "ADMIN"),
    resource(name),
    validate(adminListSchema),
    asyncHandler(adminList),
  );
  adminCatalogRouter.get(
    `/${name}/:id`,
    authorize("CURATOR", "ADMIN"),
    resource(name),
    validate(catalogIdSchema),
    asyncHandler(adminGet),
  );
  adminCatalogRouter.post(
    `/${name}`,
    authorize("CURATOR", "ADMIN"),
    resource(name),
    validate(createSchemas[name]),
    asyncHandler(adminCreate),
  );
  adminCatalogRouter.patch(
    `/${name}/:id`,
    authorize("CURATOR", "ADMIN"),
    resource(name),
    validate(updateSchemas[name]),
    asyncHandler(adminUpdate),
  );
  adminCatalogRouter.post(
    `/${name}/:id/publish`,
    authorize("ADMIN"),
    resource(name),
    validate(transitionSchema),
    asyncHandler(adminPublish),
  );
  adminCatalogRouter.post(
    `/${name}/:id/archive`,
    authorize("ADMIN"),
    resource(name),
    validate(transitionSchema),
    asyncHandler(adminArchive),
  );
}

export { catalogRouter, adminCatalogRouter };
