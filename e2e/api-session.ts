import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const apiBase = '/api/v1';

export interface TestIdentity {
  identifier: string;
  password: string;
}

export const storeAdmin: TestIdentity = {
  identifier: process.env['E2E_ADMIN_USERNAME'] ?? 'pepe.admin',
  password: process.env['E2E_ADMIN_PASSWORD'] ?? 'password',
};

export const customer: TestIdentity = {
  identifier: process.env['E2E_CUSTOMER_USERNAME'] ?? 'maria.quispe',
  password: process.env['E2E_CUSTOMER_PASSWORD'] ?? 'password',
};

export const superAdmin: TestIdentity = {
  identifier: process.env['E2E_SUPER_ADMIN_USERNAME'] ?? 'superadmin',
  password: process.env['E2E_SUPER_ADMIN_PASSWORD'] ?? 'password',
};

export async function loginApi(
  request: APIRequestContext,
  identity: TestIdentity = storeAdmin,
): Promise<string> {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: identity,
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = (await response.json()) as { token: string };
  expect(body.token).toBeTruthy();
  return body.token;
}

export function bearer(token: string, extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${token}`, ...extra };
}

export async function signIn(
  page: Page,
  path: string,
  identity: TestIdentity = storeAdmin,
): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/\/iam\/sign-in/);
  await page.locator('[formControlName=identifier]').fill(identity.identifier);
  await page.locator('[formControlName=password]').fill(identity.password);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL((url) => url.pathname === path);
}
