/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DOMAIN_DIR = join(process.cwd(), 'src', 'app', 'iam', 'domain');

function collectDomainSources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return collectDomainSources(path);
    }
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('IAM domain independence', () => {
  it('does not reference db.json or outer layers', () => {
    const sources = collectDomainSources(DOMAIN_DIR);
    expect(sources.length).toBeGreaterThan(0);

    for (const source of sources) {
      const content = readFileSync(source, 'utf8');
      expect(content, source).not.toMatch(
        /db\.json|from ['"][^'"]*\/(infrastructure|application|presentation)|from ['"]@angular|from ['"]rxjs/
      );
    }
  });
});
