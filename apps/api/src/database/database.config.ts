import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

// Kudos to https://github.com/pavlokobyliatskyi/typeorm-migrations
export const dataSourceOptions: DataSourceOptions = {
	type: 'mariadb',
	host: process.env.DB_HOST || 'localhost',
	port: Number(process.env.DB_PORT) || 3306,
	username: process.env.MARIADB_USER,
	password: process.env.MARIADB_PASSWORD,
	database: process.env.MARIADB_DATABASE,
	entities: process.env.PRODUCTION === 'true' ? [] : ['**/*.entity{.ts,.js}'],
	migrations: [__dirname + '/migrations/*.{ts,js}'],
	synchronize: false,
};

export default new DataSource(dataSourceOptions);
