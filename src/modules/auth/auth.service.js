import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { conflict, unauthorized } from "../../common/errors/app-error.js";
import { getConfig } from "../../config/env.js";
import { User } from "./user.model.js";

const JWT_AUDIENCE = "whtsnyr-angular";

function canonicalEmail(email) {
  return email.trim().toLowerCase();
}

function signAccessToken(user) {
  const config = getConfig();
  return jwt.sign(
    {
      roles: user.roles,
      av: user.authorizationVersion,
    },
    config.auth.accessSecret,
    {
      algorithm: "HS256",
      subject: String(user._id),
      issuer: config.apiBaseUrl,
      audience: JWT_AUDIENCE,
      expiresIn: config.auth.accessTokenTtl,
    },
  );
}

function verifyAccessToken(token) {
  const config = getConfig();
  return jwt.verify(token, config.auth.accessSecret, {
    algorithms: ["HS256"],
    issuer: config.apiBaseUrl,
    audience: JWT_AUDIENCE,
  });
}

function authPayload(user) {
  return {
    user: user.toJSON(),
    accessToken: signAccessToken(user),
  };
}

async function registerUser(input) {
  const emailCanonical = canonicalEmail(input.email);
  if (await User.exists({ emailCanonical })) {
    throw conflict("EMAIL_ALREADY_REGISTERED", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  let user;
  try {
    user = await User.create({
      email: input.email.trim(),
      emailCanonical,
      passwordHash,
      displayName: input.displayName,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw conflict("EMAIL_ALREADY_REGISTERED", "An account with this email already exists");
    }
    throw error;
  }

  user.authorizationVersion = 1;
  return authPayload(user);
}

async function loginUser(input) {
  const user = await User.findOne({ emailCanonical: canonicalEmail(input.email) }).select(
    "+passwordHash +authorizationVersion",
  );
  const passwordMatches = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    throw unauthorized("Invalid email or password");
  }

  return authPayload(user);
}

export { signAccessToken, verifyAccessToken, registerUser, loginUser };
