import mongoose from "mongoose";

import { MOBILITY_OPTIONS, USER_ROLES, USER_STATUSES } from "../../common/constants/index.js";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    emailCanonical: { type: String, required: true, unique: true, select: false },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, maxlength: 80 },
    roles: {
      type: [{ type: String, enum: USER_ROLES }],
      default: ["VISITOR"],
      required: true,
    },
    status: { type: String, enum: USER_STATUSES, default: "ACTIVE", index: true },
    emailVerifiedAt: { type: Date },
    authorizationVersion: { type: Number, default: 1, min: 1, select: false },
    preferences: {
      dietary: [{ type: String, maxlength: 40 }],
      interests: [{ type: String, maxlength: 40 }],
      mobility: {
        type: String,
        enum: MOBILITY_OPTIONS,
        default: "STANDARD",
      },
      radius: { type: String, default: "2 km" },
      temperatureUnit: { type: String, default: "C" },
      theme: { type: String, default: "system" },
      language: { type: String, default: "en" },
    },
    bookmarks: [
      {
        placeId: { type: String, required: true },
        name: { type: String, required: true },
        photoUrl: { type: String },
        rating: { type: Number },
        types: [{ type: String }],
        distance: { type: Number },
        location: {
          latitude: { type: Number },
          longitude: { type: Number }
        }
      }
    ],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: {
      transform(_document, value) {
        delete value.__v;
        delete value.passwordHash;
        delete value.emailCanonical;
        delete value.authorizationVersion;
        return value;
      },
    },
  },
);

userSchema.index({ status: 1, createdAt: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export { USER_ROLES, USER_STATUSES, User };
