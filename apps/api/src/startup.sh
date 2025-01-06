#!/bin/sh

cd ../data-pulse && npx -c "PRODUCTION=true typeorm -d ./dist/apps/api/database/database.config.js migration:run" && cd ../current
node "./main.js"