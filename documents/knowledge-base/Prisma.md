## Prisma Features

- **strictUndefinedChecks**

  - Explicitly setting a field to undefined in a query will cause a runtime error.

  - To skip a field in a query, use the new Prisma.skip symbol instead of undefined.

## Making a Model

- ?: Add ? to indicate that the field can be null.

- @ and @@: @ is used to set a field setting and @@ is used to set the model setting.

## Attributes

### Relation

- @relation: used to define a one-to-one or one-to-many relation.
  - Implicit many-to-many relations do not require this attribute.

## Prisma ERD Generator

- It generates a Entity-Relationship Diagram based on models defined in "schema.prisma" file.

  [Link](https://www.npmjs.com/package/prisma-erd-generator)
