import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordModule } from './record/record.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRoot({
			type: 'mariadb',
			host: process.env.DB_HOST || 'localhost',
			port: Number(process.env.DB_PORT) || 3306,
			username: process.env.MARIADB_USER,
			password: process.env.MARIADB_PASSWORD,
			database: process.env.MARIADB_DATABASE,
			entities: [__dirname + '/**/*.entity{.ts,.js}'],
			synchronize: true,
			autoLoadEntities: true,
		}),
		UserModule,
		RecordModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
