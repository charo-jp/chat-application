import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../config.ts";

export type LoginRequestType = {
  email: string;
  password: string;
  deviceId: string;
};

export const loginSchema = {
  $id: "login",
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    password: {
      type: "string",
      minLength: PASSWORD_MIN_LENGTH,
      maxLength: PASSWORD_MAX_LENGTH,
    },
    deviceId: { type: "string" },
  },
  required: ["email", "password", "deviceId"],
};

export type SignupRequestType = LoginRequestType & {
  username: string;
};

export const signupSchema = {
  $id: "signup",
  type: "object",
  properties: {
    ...loginSchema.properties,
    username: { type: "string" },
  },
  required: [...loginSchema.required, "username"],
};
