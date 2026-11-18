import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AUTH_GATEWAY } from '../application/auth.gateway';
import { IAM_STORE_REPOSITORY } from '../application/tenant.store';
import { IAM_USER_REPOSITORY } from '../application/user.store';
import { TOKEN_STORAGE_PORT } from '@shared/infrastructure/storage/token-storage.port';
import { HttpStoreRepository } from './repositories/http-store.repository';
import { HttpUserRepository } from './repositories/http-user.repository';
import { HttpAuthGateway } from './auth/http-auth.gateway';
import { InMemoryTokenStorage } from './security/in-memory-token.storage';

export function provideIam(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: IAM_STORE_REPOSITORY, useClass: HttpStoreRepository },
    { provide: IAM_USER_REPOSITORY, useClass: HttpUserRepository },
    { provide: AUTH_GATEWAY, useClass: HttpAuthGateway },
    { provide: TOKEN_STORAGE_PORT, useClass: InMemoryTokenStorage },
  ]);
}
