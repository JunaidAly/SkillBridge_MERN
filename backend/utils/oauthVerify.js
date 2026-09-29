// Server-side verification of OAuth credentials.
//
// The rule these helpers exist to enforce: identity NEVER comes from the
// request body. Previously /auth/google and /auth/facebook read `email` and
// `name` straight off the client payload, so anyone could POST an arbitrary
// email and be issued a session for it - a full account-takeover path. The
// only trustworthy source is a token validated against the provider, and the
// only fields we act on are the ones the provider hands back.
import { OAuth2Client } from 'google-auth-library';

// Thrown for anything that should surface as an auth failure rather than a 500.
class OAuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'OAuthError';
    this.status = status;
  }
}

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const FB_GRAPH = 'https://graph.facebook.com';

const looksLikeJwt = (token) => token.split('.').length === 3;

/**
 * Verifies a Google credential and returns { sub, email, name }.
 *
 * Accepts either an ID token (JWT) or an OAuth2 access token - the frontend's
 * implicit flow yields the latter. Both paths check that the credential was
 * minted for OUR client id, which is what stops a token issued to some other
 * Google app from being replayed here.
 */
export async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new OAuthError('Google login is not configured on this server.', 503);
  }
  if (!credential || typeof credential !== 'string') {
    throw new OAuthError('Missing Google credential.', 400);
  }

  if (looksLikeJwt(credential)) {
    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      // Deliberately opaque, and deliberately not falling back to the body.
      throw new OAuthError('Google sign-in could not be verified.');
    }

    if (!payload?.email) throw new OAuthError('Google sign-in could not be verified.');
    if (payload.email_verified !== true && payload.email_verified !== 'true') {
      throw new OAuthError('Your Google email address is not verified.');
    }
    return { sub: payload.sub, email: payload.email, name: payload.name || payload.email };
  }

  // Access token path: ask Google who this token belongs to.
  const infoRes = await fetch(`${GOOGLE_TOKENINFO_URL}?access_token=${encodeURIComponent(credential)}`);
  if (!infoRes.ok) throw new OAuthError('Google sign-in could not be verified.');
  const info = await infoRes.json();

  // `aud` is the client the token was issued to - the audience check.
  if (info.aud !== clientId && info.azp !== clientId) {
    throw new OAuthError('Google sign-in could not be verified.');
  }
  if (!info.email) throw new OAuthError('Google sign-in could not be verified.');
  if (info.email_verified !== true && info.email_verified !== 'true') {
    throw new OAuthError('Your Google email address is not verified.');
  }

  // tokeninfo doesn't carry a display name; userinfo does.
  let name = info.email;
  try {
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      // Same subject or we don't use it.
      if (profile.sub === info.sub && profile.name) name = profile.name;
    }
  } catch {
    // Display name is cosmetic - a failure here must not block a verified login.
  }

  return { sub: info.sub, email: info.email, name };
}

/**
 * Verifies a Facebook user access token and returns { id, email, name }.
 *
 * Two calls on purpose: /debug_token proves the token is valid AND was issued
 * for this app (a token for someone else's app would otherwise sail through
 * /me), and /me returns the identity straight from Facebook.
 */
export async function verifyFacebookAccessToken(accessToken) {
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();

  // Fail closed. Without the secret we cannot prove which app a token belongs
  // to, and a half-check is what created this vulnerability the first time.
  if (!appId || !appSecret) {
    throw new OAuthError('Facebook login is not configured on this server.', 503);
  }
  if (!accessToken || typeof accessToken !== 'string') {
    throw new OAuthError('Missing Facebook access token.', 400);
  }

  const appAccessToken = `${appId}|${appSecret}`;
  const debugRes = await fetch(
    `${FB_GRAPH}/debug_token?input_token=${encodeURIComponent(accessToken)}` +
    `&access_token=${encodeURIComponent(appAccessToken)}`
  );
  if (!debugRes.ok) throw new OAuthError('Facebook sign-in could not be verified.');

  const debug = (await debugRes.json())?.data;
  if (!debug?.is_valid) throw new OAuthError('Facebook sign-in could not be verified.');
  if (String(debug.app_id) !== String(appId)) {
    throw new OAuthError('Facebook sign-in could not be verified.');
  }

  const meRes = await fetch(
    `${FB_GRAPH}/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!meRes.ok) throw new OAuthError('Facebook sign-in could not be verified.');

  const me = await meRes.json();
  // The token's subject must match the profile it just returned.
  if (!me?.id || String(me.id) !== String(debug.user_id)) {
    throw new OAuthError('Facebook sign-in could not be verified.');
  }
  if (!me.email) {
    throw new OAuthError(
      'Your Facebook account has no email address available. Please sign up with email instead.',
      400
    );
  }

  return { id: String(me.id), email: me.email, name: me.name || me.email };
}

export { OAuthError };
