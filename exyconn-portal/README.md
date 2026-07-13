# exyconn-portal

Internal role-based portal for Exyconn. Employees log in once and land on a module
dashboard scoped to their role (ADMIN sees everything).

- **UI** — React + Vite + TypeScript + MUI + Apollo Client (port **1001**)
- **Server** — Express + Apollo Server + Mongoose + GraphQL (port **1002**)
- **Package manager** — pnpm workspace

11 modules: `admin, finance, bugs, clients, employee, hr, marketing, legal, ai, crm, products`.

## Getting started

```bash
# Server
cd server
cp .env.example .env      # fill MONGODB_URI + JWT_SECRET
npm install
npm run seed              # seed ADMIN user + demo data
npm run dev               # http://localhost:1002/graphql

# UI
cd ui
cp .env.example .env
npm install
npm run codegen           # generate typed GraphQL hooks
npm run dev               # http://localhost:1001
```

## Conventions
See [.claude/CLAUDE.md](.claude/CLAUDE.md). Key rules: MUI only, Formik + Yup,
GraphQL Codegen, ≤200 lines per `.tsx`, singleton design, MUI dialogs (no native
alert/confirm), date-fns + MUIX pickers driven by admin settings, tests under
`__tests__/{unit-tests,e2e}`.
