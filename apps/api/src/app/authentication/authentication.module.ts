import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy, LocalStrategy } from './strategy';

@Module({
	imports: [
		UserModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
				signOptions: {
					expiresIn: parseInt(configService.getOrThrow<string>('ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC')),
				},
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthenticationController],
	providers: [AuthenticationService, LocalStrategy, JwtStrategy],
})
export class AuthenticationModule {}
