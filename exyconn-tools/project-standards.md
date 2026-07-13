# Project Standards

Create separate folders for each tool in both the UI and the server.

## UI Improvements

1. No .tsx file should exceed 200 lines. If it does, break it down into multiple smaller, reusable components, organized inside a folder named after the main component.
2. Use the **`size` attribute** for **MUI Grid** layouts. and import from import Grid from '@mui/material/Grid';
3. Avoid using **SCSS**.
4. Please make sure all things should be absolute responsive
5. Use Formik and Yup for and React Form
6. Use Context API only for deep or global data sharing; otherwise use props with strongly typed interfaces and avoid any, unknown, and misuse of never.
7. Use MUI Components only
8. Add Breadcrumb to all Pages
9. Ensure every table supports pagination, filtering, searching, and sorting, with backend APIs designed accordingly.

## Backend Improvements

1. Segregate each feature into the following files:
   1. `<feature>.controllers.ts`
   2. `<feature>.models.ts`
   3. `<feature>.routes.ts`
   4. `<feature>.validators.ts` (use **Zod**)
   5. `<feature>.services.ts`

## For Both Projects

1. Run **build** and **type checks**.
2. Fix all build and type errors. Perform a strict review and ensure no file is skipped.
3. Format the code if everything is correct.
4. Push the final code.
