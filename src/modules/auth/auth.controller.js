import { sendData } from "../../common/utils/api-response.js";
import { notFound } from "../../common/errors/app-error.js";
import { User } from "./user.model.js";
import { loginUser, registerUser } from "./auth.service.js";

async function register(request, response) {
  const payload = await registerUser(request.validated.body);
  return sendData(response, payload, { status: 201 });
}

async function login(request, response) {
  const payload = await loginUser(request.validated.body);
  return sendData(response, payload);
}

async function getMe(request, response) {
  return sendData(response, request.auth.user.toJSON());
}

async function updateMe(request, response) {
  const user = await User.findOneAndUpdate(
    { _id: request.auth.userId, status: "ACTIVE" },
    { $set: request.validated.body },
    { new: true, runValidators: true },
  );
  if (!user) throw notFound("User");
  return sendData(response, user);
}

async function listUsers(request, response) {
  const { cursor, limit, status } = request.validated.query;
  const filter = {
    ...(cursor ? { _id: { $lt: cursor } } : {}),
    ...(status ? { status } : {}),
  };
  const users = await User.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1);
  const hasMore = users.length > limit;
  if (hasMore) users.pop();
  return sendData(response, users, {
    meta: { nextCursor: hasMore ? String(users.at(-1)._id) : null, limit },
  });
}

async function updateUserStatus(request, response) {
  const user = await User.findByIdAndUpdate(
    request.validated.params.id,
    { $set: { status: request.validated.body.status }, $inc: { authorizationVersion: 1 } },
    { new: true, runValidators: true },
  );
  if (!user) throw notFound("User");
  return sendData(response, user);
}

async function updateUserRoles(request, response) {
  const roles = [...new Set(request.validated.body.roles)];
  const user = await User.findByIdAndUpdate(
    request.validated.params.id,
    { $set: { roles }, $inc: { authorizationVersion: 1 } },
    { new: true, runValidators: true },
  );
  if (!user) throw notFound("User");
  return sendData(response, user);
}

export { register, login, getMe, updateMe, listUsers, updateUserStatus, updateUserRoles };
