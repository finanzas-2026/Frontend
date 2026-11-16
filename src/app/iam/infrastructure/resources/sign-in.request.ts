/**
 * Credentials sent to the sign-in endpoint.
 *
 * The IAM schema exposes both `username` and `email`, but the approved user
 * story authenticates with "usuario y contraseña". The backend auth endpoint
 * is not implemented in `db/db.json` yet, so only this documented contract is
 * prepared; it must be re-verified when the endpoint exists.
 */
export interface SignInRequest {
  readonly username: string;
  readonly password: string;
}
