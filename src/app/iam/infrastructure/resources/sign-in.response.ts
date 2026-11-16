/**
 * Provisional sign-in response.
 *
 * No authentication endpoint exists in the current fake backend, so no
 * response body could be verified. The API contract documents Bearer/JWT
 * authentication, therefore the only assumed field is the session token.
 * Refresh tokens, user payloads and `access_token` naming are intentionally
 * not assumed; this interface must be updated once the backend is available.
 */
export interface SignInResponse {
  readonly token: string;
}
