import { Logger, NestApplicationOptions, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { readFileSync } from 'fs';
import { AppModule } from './app/app.module';

async function bootstrap() {
	const certPath = process.env.SSL_CERTIFICATE_PATH;
	const keyPath = process.env.SSL_KEY_PATH;
	const allowedOrigins =
		process.env.ALLOWED_ORIGINS !== undefined && process.env.ALLOWED_ORIGINS !== '' ? process.env.ALLOWED_ORIGINS?.split(';') : [];

	let serverOptions: NestApplicationOptions | undefined = undefined;
	if (certPath && keyPath) {
		const httpsOptions = {
			key: readFileSync(keyPath),
			cert: readFileSync(certPath),
		};

		serverOptions = { httpsOptions };
	}

	const app = await NestFactory.create<NestExpressApplication>(AppModule, serverOptions);
	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);
	app.useGlobalPipes(new ValidationPipe({ transform: true }));
	app.set('query parser', 'extended');
	app.enableCors({
		origin: allowedOrigins,
	});
	app.enableVersioning({
		type: VersioningType.URI,
		prefix: '',
	});

	const port = process.env.PORT || 3000;
	await app.listen(port);
	Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
