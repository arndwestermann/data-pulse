#!/bin/sh

npx -c "PRODUCTION=true typeorm -d ./database/database.config.js migration:run" && node "./main.js"