import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordModule } from './record/record.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './authentication/guards';
import { RoleModule } from './role/role.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'mariadb',
				host: process.env.DB_HOST || 'localhost',
				port: Number(process.env.DB_PORT) || 3306,
				username: process.env.MARIADB_USER,
				password: process.env.MARIADB_PASSWORD,
				database: process.env.MARIADB_DATABASE,
				autoLoadEntities: true,
				synchronize: false,
			}),
		}),
		UserModule,
		RecordModule,
		AuthenticationModule,
		RoleModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: JwtGuard,
		},
	],
})
export class AppModule {}
