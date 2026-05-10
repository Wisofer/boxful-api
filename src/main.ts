import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import type { AppConfiguration } from './config/app-configuration.type';
import { configureApplication } from './configure-app';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<AppConfiguration['port']>('port');
  await app.listen(port);

  Logger.log(`Application listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
