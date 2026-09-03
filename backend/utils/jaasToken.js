import jwt from 'jsonwebtoken';

const TOKEN_LIFETIME_SECONDS = 2 * 60 * 60; // 2 hours - keep short, per JaaS guidance
const NOT_BEFORE_BUFFER_SECONDS = 10; // small clock-skew buffer, matches 8x8's own sample

// The full PEM file (including "-----BEGIN/END PRIVATE KEY-----" armor and its
// internal newlines) is stored base64-encoded in JAAS_PRIVATE_KEY_BASE64, which
// survives .env untouched since it's a single line with no literal newlines to lose.
function loadPrivateKey() {
  const raw = (process.env.JAAS_PRIVATE_KEY_BASE64 || '').trim();
  if (!raw) {
    throw new Error('JAAS_PRIVATE_KEY_BASE64 is not set');
  }

  const decoded = Buffer.from(raw, 'base64').toString('utf-8');
  if (!decoded.includes('-----BEGIN')) {
    throw new Error('JAAS_PRIVATE_KEY_BASE64 did not decode to a valid PEM');
  }

  return decoded;
}

// Generates a short-lived, per-participant JWT for one JaaS room.
// isModerator should be true only for the meeting's organizer.
export function generateJaasToken({ userId, name, email, isModerator }) {
  const privateKey = loadPrivateKey();
  const appId = process.env.JAAS_APP_ID;
  const kid = process.env.JAAS_API_KEY_ID;

  if (!appId || !kid) {
    throw new Error('JAAS_APP_ID or JAAS_API_KEY_ID is not set');
  }

  const nowSeconds = Math.round(Date.now() / 1000);

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,
    // Scoped to '*' (all rooms under this AppID) rather than a specific room name:
    // 8x8's own JWT docs never document the exact literal-match format expected for a
    // non-wildcard room claim (checked directly - only the '*' example is confirmed to
    // work), and getting that format wrong would silently break joins. Access is still
    // gated per-meeting by our own participant-authorization check before a token is
    // ever minted, and the token itself is short-lived and tied to one user.
    room: '*',
    exp: nowSeconds + TOKEN_LIFETIME_SECONDS,
    nbf: nowSeconds - NOT_BEFORE_BUFFER_SECONDS,
    context: {
      user: {
        id: userId,
        name,
        email,
        // JaaS expects these as the literal strings "true"/"false", not booleans -
        // confirmed against 8x8's own official jaas_demo sample code.
        moderator: isModerator ? 'true' : 'false',
      },
      features: {
        livestreaming: 'false',
        recording: 'false',
        transcription: 'false',
        'outbound-call': 'false',
      },
    },
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256', header: { kid } });
}
