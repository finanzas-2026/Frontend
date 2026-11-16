/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IAM_ROUTES } from './iam.routes';

const PRESENTATION_DIR = join(
  process.cwd(),
  'src',
  'app',
  'iam',
  'presentation'
);

function collectSources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return collectSources(path);
    }
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('IAM Presentation independence', () => {
  const sources = collectSources(PRESENTATION_DIR);

  it('contains presentation sources to inspect', () => {
    expect(sources.length).toBeGreaterThanOrEqual(4);
  });

  it('defines lazy routes for sign-in and tenant management', () => {
    expect(IAM_ROUTES.some((route) => route.path === 'sign-in')).toBe(true);
    expect(IAM_ROUTES.some((route) => route.path === 'tenants')).toBe(true);
    expect(
      IAM_ROUTES.filter((route) => route.loadComponent !== undefined)
    ).toHaveLength(2);
  });

  it('does not import Infrastructure, HTTP clients, APIs or resources', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /from ['"][^'"]*iam\/infrastructure|from ['"]\.\.\/infrastructure\//
      );
      expect(content, source).not.toMatch(
        /from ['"]@angular\/common\/http['"]/
      );
      expect(content, source).not.toMatch(
        /from ['"][^'"]*(?:IamApi|UserApi|StoreApi|HttpUserRepository|HttpStoreRepository|Assembler|resources)['"]/
      );
      expect(content, source).not.toMatch(/from ['"][^'"]*\/resources\//);
    }
  });

  it('does not access persistence, tokens or browser storage directly', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /db\.json|TOKEN_STORAGE_PORT|SessionTokenStorage|localStorage|sessionStorage|document\.cookie/
      );
      expect(content, source).not.toMatch(/\bfetch\s*\(/);
    }
  });

  it('contains no unsafe TypeScript escapes', () => {
    for (const source of sources) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).not.toMatch(
        /@ts-ignore|@ts-expect-error|\bas any\b|:\s*any\b|<any>/
      );
    }
  });

  it('keeps external templates and styles for pages and components', () => {
    for (const source of sources.filter((path) => !path.endsWith('iam.routes.ts'))) {
      const content = readFileSync(source, 'utf8');

      expect(content, source).toMatch(/templateUrl:\s*['"]\.\//);
      expect(content, source).toMatch(/styleUrl:\s*['"]\.\//);
      expect(content, source).not.toMatch(/\btemplate:\s*[`'"]/);
      expect(content, source).not.toMatch(/\bstyles:\s*\[/);
    }
  });
});
