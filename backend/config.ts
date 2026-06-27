// Password Configurations -----------------------------------------------------------
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 64;

export const BCRYPT_TIMING_DUMMY =
  "$2b$12$ghFFtEJjJusA3AejWUn1h.otnCuxVC..ttVH/O2qQaV7ADOVYptIm";

// JWT Configurations ----------------------------------------------------------------
export const JWT_VALID_DURATION = "15m";
export const JWT_REFRESH_DURATION = "7d";

// Refresh token cookie --------------------------------------------------------------
export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
// Max age in seconds, kept in sync with JWT_REFRESH_DURATION (7 days).
export const REFRESH_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Access token cookie ---------------------------------------------------------------
export const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
// Max age in seconds, kept in sync with JWT_VALID_DURATION (15 minutes).
export const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 15;
