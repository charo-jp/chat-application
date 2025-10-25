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

## ORM commands

- Print a list of commands available

  > npx prisma

- Set up Prisma ORM project

  > npx prisma init --datasource-provider postgresql --output ../generated/prisma

- Read your prisma schema and generate the prisma client

  > npx prisma generate

- Migrate schema to database

  > npx prisma migrate dev --name init
  > The command generates a new migration based on your schema defined in "schema.prisma" file.
  > It creates migration files that **keep track of changes**.
  > You need to run this command whenever you change prisma schema.

- Two ways to update your database schema.

  > prisma migrate dev

  > prisma db push

  - update your database schema directly (without creating migration files).
  - good for early development where shcema changes are frequent.
