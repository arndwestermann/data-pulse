import { Logger, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { readFileSync } from 'fs';

async function bootstrap() {
	const certPath = process.env.SSL_CERTIFICATE_PATH;
	const keyPath = process.env.SSL_KEY_PATH;

	let serverOptions: NestApplicationOptions | undefined = undefined;
	if (certPath && keyPath) {
		const httpsOptions = {
			key: readFileSync(keyPath),
			cert: readFileSync(certPath),
		};

		serverOptions = { httpsOptions };
	}

	const app = await NestFactory.create(AppModule, serverOptions);
	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);
	app.enableCors({
		origin: ['http://localhost:4200', 'https://localhost:4200', 'http://localhost', 'http://plesk.mike-westermann.de:81'],
	});

	const port = process.env.PORT || 3000;
	await app.listen(port);
	Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
