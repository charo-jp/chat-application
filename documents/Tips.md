## Database commands

- Connect to PostgreSQL

  > sudo -u postgres psql

- Get out of the shell

  > \quit

- Show a list of databases

  > \l

- Select a database

  > \c database_name

- Show a list of users

  > \du

- Create a databse

  > CREATE DATABASE database_name;

- Select a database

  > \c database

- Create a user

  > CREATE USER app_user WITH PASSWORD 'your_password';
  > CREATE USER app_user WITH PASSWORD 'your_password' CREATEDB CREATEROLE;

- Change a user

  > \c - chat_app_dev

- Show a list of tables

  > \dt

- Show a list of user database

  > SELECT * FROM "user";

## ORM commands

- Print a list of commands available

  > npx prisma

- Set up Prisma ORM project

  > npx prisma init --datasource-provider postgresql --output ../generated/prisma

- Read your prisma schema and generate the prisma client

  > npx prisma generate

- Migrate schema to database

  > npx prisma migrate dev --name init
  > The command generates a new migration filebased on your schema defined in "schema.prisma" file.
  > A migration file is like a git commit. It **keeps track of changes**.
  > You need to run this command **WHENEVER you change prisma schema**.

- Two ways to update your database schema.

  > prisma migrate dev

  > prisma db push
  - update your database schema directly (without creating migration files).
  - good for early development where shcema changes are frequent.

- show data inside database
  > npx prisma studio

## How to update the database (schema change workflow)

Run these from the `backend/` directory whenever you change `prisma/schema.prisma`
(e.g. adding a field, model, or index).

1. Edit `prisma/schema.prisma` — make your change (add/modify a field or model).

2. Create and apply a migration:

   > npx prisma migrate dev --name <short_description>

   Example: `npx prisma migrate dev --name add_user_refresh_token`
   - Generates a new migration file under `prisma/migrations/`.
   - Applies the SQL to your local database.
   - Regenerates the Prisma Client automatically, so your TypeScript types stay in sync.

3. Verify (optional):

   > npx prisma studio
   - Opens a GUI to confirm the new column/table exists.

Notes:
- The `--name` is a human-readable label (like a git commit message). Keep it short and descriptive.
- Commit the generated `prisma/migrations/` files — they are the source of truth for the DB schema and must be shared with the team.
- Use `npx prisma migrate dev` (not `prisma db push`) so changes are tracked as migration files.
- For applying existing migrations on another machine / in CI, use `npx prisma migrate deploy`.

## Vite
- run the server
  > npm run dev
  - Run Vite and Storybook at the same time: npm run start:all

## Backend
Running the backend
- npm start 