# Tech Stack

## Table of Contents

- [Database](#database)
- [ORM](#orm)
- [API](#api)
- [Routing](#routing)
- [State Management](#state-management)
- [UI Components](#ui-components)

## Database

- **PostgreSQL**
  A relational database was chosen over NoSQL database due to chat application's interconnected pieces of data such as users, messages, and chats.

Among many relational databases such as MySQL and PostgreSQL,
PostgreSQL was selected because of one of the features that the chat application has: frequent data uploading to the database[^1].

[^1]: https://www.strongdm.com/blog/postgresql-vs-mysql

## ORM

ORM (Object Relation Mapping) is chosen for multiple reasons:

1. ORMs reduce the need to write repetitive and error-prone SQL for common CRUD operations, while still allowing raw SQL when needed.

2. ORMs bridge the gap between relational databases and object-oriented language

- **Prisma**
  Prisma is the choice for the project because I am more familiar with Prisma over TypeORM.

## API

While ExpressJS has been a popular choice for APIs, Fastify is chosen for its speed.
According to [this website](https://medium.com/@ignatovich.dm/express-js-vs-fastify-comparison-for-building-node-js-applications-0a6c8aca0136), Fastify can take requests four times more than Express can take. As the chat application should be designed to have an ability to accept thousands of requests in a short amount of time, Fastify was selected for the project.

## Routing

Tanstack is the choice of this application due to its type safety and rich features such as built-in route loaders. In addition to that, I am simply interested in Tanstack.

## Authentication

JWT-based authentication via `@fastify/jwt`, with two separate token types stored as httpOnly cookies.

**Access token**
- Short-lived (15 minutes), signed with `JWT_ACCESS_TOKEN_SECRET`
- Stored in an httpOnly cookie (`accessToken`), `path: "/"` — sent with every request
- Verified by the `authenticate` decorator via `request.accessTokenJwtVerify()`

**Refresh token**
- Long-lived (7 days), signed with `JWT_REFRESH_TOKEN_SECRET`
- Stored in an httpOnly cookie (`refreshToken`), `path: "/auth/refresh"` — only sent to the refresh endpoint
- Rotated on each use; current value stored in the DB to detect reuse of revoked tokens

**Why two separate secrets**
Using different secrets per token type means a refresh token is cryptographically invalid as an access token — the separation is enforced by the signature itself, not just a payload field check.

**Password hashing**
bcrypt (cost factor 12). A pre-generated dummy hash (`BCRYPT_TIMING_DUMMY`) is used when the user is not found, so login response time is the same regardless of whether the email exists.

## State Management

Zustand is the choice for this project. I used to use jotai as a library for global state management; however, it get complicated because global states are everywhere inside the codebase making it difficult to track states. In addition, it renders every time a single state changes. Zustand solves those problems.

## UI components

ShadCn is selected for the project due to its customizability and ownership.
