/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // 1. Cross-context internal imports: Contexts can only import another context via its public index.ts
    {
      name: 'no-cross-context-internal-imports',
      comment: 'Bounded contexts must only communicate via public API (index.ts) or primitive IDs',
      severity: 'error',
      from: {
        path: '^src/app/(financing|sales|settlements|analytics)/',
      },
      to: {
        path: '^src/app/(financing|sales|settlements|analytics)/',
        pathNot: [
          // allow importing from within the same context
          '^src/app/$1/',
          // allow importing from the public entry point of other contexts
          '^src/app/(financing|sales|settlements|analytics)/index\\.ts$',
        ],
      },
    },
    // 2. Domain layer purity: domain cannot import application, infrastructure, or presentation
    {
      name: 'domain-layer-purity',
      comment: 'Domain layer cannot depend on application, infrastructure, or presentation layers',
      severity: 'error',
      from: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/domain/',
      },
      to: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/(application|infrastructure|presentation)/',
      },
    },
    // 3. Domain layer isolation: BC domain can only import its own domain or shared/domain
    {
      name: 'bc-domain-isolation',
      comment: 'Bounded Context domain can only import shared/domain or its own domain',
      severity: 'error',
      from: {
        path: '^src/app/(financing|sales|settlements|analytics)/domain/',
      },
      to: {
        path: '^src/app/(financing|sales|settlements|analytics)/domain/',
        pathNot: [
          '^src/app/$1/domain/',
          '^src/app/shared/domain/',
        ],
      },
    },
    // 4. Application layer purity: application cannot import infrastructure or presentation
    {
      name: 'application-layer-purity',
      comment: 'Application layer cannot depend on infrastructure or presentation layers',
      severity: 'error',
      from: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/application/',
      },
      to: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/(infrastructure|presentation)/',
      },
    },
    // 5. Presentation layer purity: presentation cannot import infrastructure directly
    {
      name: 'presentation-no-infrastructure',
      comment: 'Presentation layer cannot depend directly on infrastructure layer',
      severity: 'error',
      from: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/presentation/',
      },
      to: {
        path: '^src/app/(shared|financing|sales|settlements|analytics)/infrastructure/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.app.json',
    },
  },
};
