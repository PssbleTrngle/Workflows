import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import config from "../config";
import { ApiError } from "../error";

type StateParams = {
  returnTo?: string;
};

type StateMetadata = StateParams & {
  timestamp: number;
  nonce: string;
};

const STATE_SECRET = config.app.oauth.clientSecret;
const MAX_AGE = 60_0000;

export function generateState(params: StateParams = {}) {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString("base64url");

  const data = JSON.stringify({
    ...params,
    timestamp,
    nonce,
  } satisfies StateMetadata);

  const encodedPayload = Buffer.from(data).toString("base64url");

  const hmac = createHmac("sha256", STATE_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function validateState(state: string) {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new ApiError("state parameter has invalid format", 400);
  }

  const hmac = createHmac("sha256", STATE_SECRET);
  hmac.update(encodedPayload);
  const expectedSignature = hmac.digest("base64url");

  if (
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    throw new ApiError("state parameter signature is invalid", 400);
  }

  // Decode and parse payload
  const metadata: StateMetadata = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString(),
  );

  // Check timestamp
  if (Date.now() - metadata.timestamp > MAX_AGE) {
    throw new ApiError("state parameter has expired", 400);
  }

  return metadata;
}
