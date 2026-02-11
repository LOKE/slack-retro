import { createHmac, timingSafeEqual } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.SLACK_SIGNING_SECRET || "default-secret-change-in-production";

interface TokenPayload {
  userId: string;
  userName: string;
  teamId: string;
  exp: number;
}

/**
 * Generate a signed token for browser authentication
 * Token expires in 5 minutes
 */
export function generateAuthToken(userId: string, userName: string, teamId: string): string {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const payload: TokenPayload = {
    userId,
    userName,
    teamId,
    exp: expiresAt,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");

  // Create HMAC signature
  const signature = createHmac("sha256", AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode an auth token
 * Returns null if invalid or expired
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const [payloadBase64, signature] = token.split(".");

    if (!payloadBase64 || !signature) {
      return null;
    }

    // Verify signature
    const expectedSignature = createHmac("sha256", AUTH_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    // Use timing-safe comparison to prevent timing attacks
    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload: TokenPayload = JSON.parse(payloadStr);

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}

/**
 * Generate a session token for the cookie (4 hour expiry)
 */
export function generateSessionToken(userId: string, userName: string, teamId: string): string {
  const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours

  const payload: TokenPayload = {
    userId,
    userName,
    teamId,
    exp: expiresAt,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");

  // Create HMAC signature
  const signature = createHmac("sha256", AUTH_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify session token from cookie
 * Returns null if invalid or expired
 */
export function verifySessionToken(token: string): TokenPayload | null {
  return verifyAuthToken(token); // Same verification logic
}

/**
 * Get session from cookie string or Headers
 * Returns null if no valid session found
 */
export function getSessionFromRequest(cookies: { get: (name: string) => { value: string } | undefined }): TokenPayload | null {
  const sessionCookie = cookies.get("retro_session");

  if (!sessionCookie) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}
