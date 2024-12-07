# DataPulse

## Dev server

- Run `npm run api`

## Build

- Run `npm run api:build`
  - Note: This will also build the migrations

## Migrations

For a fresh installation run the migrations drop the database and run the migrations.
On a clean database an admin user is created with the username `admin` and password `admin`. Change the admin password in production!

- To Generate migrations run `npm run migration:generate --name=migration-name`
  - Note: This will override the built application in `dist` and vice versa if the dev server is running and changes were made the application is re-compiled and the migrations will be removed, so if the dev server restarted run `npm run migrations:build` if you plan to apply new migrations
- To apply migrations run `npm run migrations:up`
- To revert migrations run `npm run migrations:down`
