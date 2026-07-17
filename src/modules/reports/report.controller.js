import { conflict, notFound } from "../../common/errors/app-error.js";
import { sendData } from "../../common/utils/api-response.js";
import { catalogModels } from "../catalog/catalog.service.js";
import { ContentReport } from "./content-report.model.js";

function pagination(documentList, limit) {
  const hasMore = documentList.length > limit;
  if (hasMore) documentList.pop();
  return {
    data: documentList,
    meta: { limit, nextCursor: hasMore ? String(documentList.at(-1)._id) : null },
  };
}

async function createReport(request, response) {
  const { target, reason, details } = request.validated.body;
  const exists = await catalogModels[target.type].exists({
    _id: target.id,
    status: "PUBLISHED",
    archivedAt: null,
  });
  if (!exists) throw notFound("Reported resource");

  const report = await ContentReport.create({
    reporterId: request.auth.userId,
    target,
    reason,
    details,
  });
  return sendData(response, report, { status: 201 });
}

async function listOwnReports(request, response) {
  const { cursor, limit, status } = request.validated.query;
  const reports = await ContentReport.find({
    reporterId: request.auth.userId,
    ...(cursor ? { _id: { $lt: cursor } } : {}),
    ...(status ? { status } : {}),
  })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const result = pagination(reports, limit);
  return sendData(response, result.data, { meta: result.meta });
}

async function getOwnReport(request, response) {
  const report = await ContentReport.findOne({
    _id: request.validated.params.id,
    reporterId: request.auth.userId,
  }).lean();
  if (!report) throw notFound("Report");
  return sendData(response, report);
}

async function listAllReports(request, response) {
  const { cursor, limit, status } = request.validated.query;
  const reports = await ContentReport.find({
    ...(cursor ? { _id: { $lt: cursor } } : {}),
    ...(status ? { status } : {}),
  })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const result = pagination(reports, limit);
  return sendData(response, result.data, { meta: result.meta });
}

async function updateReport(request, response) {
  const { expectedVersion, ...patch } = request.validated.body;
  if (patch.status === "RESOLVED" || patch.status === "REJECTED") {
    patch.resolvedAt = new Date();
  }
  const report = await ContentReport.findOneAndUpdate(
    { _id: request.validated.params.id, version: expectedVersion },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!report) {
    if (await ContentReport.exists({ _id: request.validated.params.id })) {
      throw conflict("VERSION_CONFLICT", "The report changed; reload it before updating");
    }
    throw notFound("Report");
  }
  return sendData(response, report);
}

export { createReport, listOwnReports, getOwnReport, listAllReports, updateReport };
