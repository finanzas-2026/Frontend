import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '@shared/application/app-error';
import { toSessionUser, SessionUser, AuthSession } from '../../application/auth-session';
import {
  AuthGateway,
  AuthenticationCredentials,
  RegistrationCommand,
} from '../../application/auth.gateway';
import { IamApi } from '../api/iam.api';
import { HttpUserRepository } from '../repositories/http-user.repository';

/**
 * HTTP adapter for the IAM authentication port.
 *
 * It delegates credential verification to the backend endpoint and resolves the
 * authenticated identity through the existing user repository. It does not
 * validate passwords in the browser and does not fabricate a session.
 */
@Service()
export class HttpAuthGateway implements AuthGateway {
  private readonly iamApi = inject(IamApi);
  private readonly userRepository = inject(HttpUserRepository);

  async signIn(credentials: AuthenticationCredentials): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.iamApi.signIn({
        username: credentials.username,
        password: credentials.password,
      }),
    );

    const user = await this.userRepository.findByUsername(credentials.username);
    if (!user) {
      throw new AppError(
        'IAM_USER_NOT_FOUND',
        'No se pudo resolver la identidad autenticada.',
        404,
      );
    }

    return {
      user: toSessionUser(user),
      token: response.token,
    };
  }

  async signUp(command: RegistrationCommand): Promise<SessionUser> {
    const response = await firstValueFrom(
      this.iamApi.signUp({
        username: command.username,
        password: command.password,
        first_name: command.firstName,
        last_name: command.lastName,
        email: command.email,
        store_id: command.storeId,
      }),
    );

    return {
      id: response.id,
      storeId: response.store_id,
      username: response.username,
      firstName: response.first_name,
      lastName: response.last_name,
      email: response.email,
      role: response.user_type,
      status: response.status,
    };
  }
}
