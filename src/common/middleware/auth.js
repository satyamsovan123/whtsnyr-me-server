import { forbidden, unauthorized } from "../errors/app-error.js";
import { verifyAccessToken } from "../../modules/auth/auth.service.js";
import { User } from "../../modules/auth/user.model.js";

async function authenticate(request, _response, next) {
  try {
    const authorization = request.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");
    
    // DEV MODE BYPASS
    if (process.env.NODE_ENV === "development" && (!scheme || !token)) {
      const devUser = await User.findOne({ status: "ACTIVE" });
      if (devUser) {
        request.auth = {
          userId: String(devUser._id),
          roles: devUser.roles,
          user: devUser,
        };
        return next();
      }
    }

    if (scheme !== "Bearer" || !token) {
      throw unauthorized();
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, status: "ACTIVE" }).select(
      "+authorizationVersion",
    );
    if (!user || user.authorizationVersion !== payload.av) {
      throw unauthorized("The access token is no longer valid");
    }

    request.auth = {
      userId: String(user._id),
      roles: user.roles,
      user,
    };
    return next();
  } catch (error) {
    if (error?.status === 401) return next(error);
    return next(unauthorized("The access token is invalid or expired"));
  }
}

function authorize(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.auth?.roles?.some((role) => allowedRoles.includes(role))) {
      return next(forbidden());
    }
    return next();
  };
}

async function optionalAuthenticate(request, _response, next) {
  try {
    const authorization = request.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");
    
    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, status: "ACTIVE" });
    if (!user) {
      return next();
    }

    request.auth = {
      userId: String(user._id),
      roles: user.roles,
      user,
    };
    return next();
  } catch (error) {
    return next();
  }
}

export { authenticate, authorize, optionalAuthenticate };
