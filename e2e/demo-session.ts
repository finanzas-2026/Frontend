import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

const seed = JSON.parse(readFileSync('db/db.json', 'utf8')) as {
  users: { id: number; store_id: number; user_type: string; username: string; password_hash: string }[];
};

export const demoApi = 'http://localhost:8080/api/v1';
const operator = seed.users.find((user) => user.user_type === 'STORE_ADMIN' && user.store_id === 1);
if (!operator) throw new Error('Falta el operador de la semilla de demo.');

export const operatorHeaders = { 'X-Demo-User-Id': String(operator.id) };

export async function signIn(page: Page, path: string, role = 'STORE_ADMIN'): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/\/iam\/sign-in/);
  const user = seed.users.find((entry) => entry.user_type === role && entry.store_id === 1);
  if (!user) throw new Error('Falta el usuario de la semilla de demo.');
  await page.locator('[formControlName=identifier]').fill(user.username);
  await page.locator('[formControlName=password]').fill(user.password_hash);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL((url) => url.pathname === path);
}
