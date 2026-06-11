import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

function parseFrontendOrigins(): string[] {
  const raw = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Geliştirmede Next.js ağ adresi (ör. 10.x:3001) ile açıldığında CORS için */
function isDevLanOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
    origin,
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useStaticAssets(join(process.cwd(), 'static', 'genres'), {
    prefix: '/genres',
  });
  // /cafes API ile çakışmaması için statik dosyalar /static/cafes altında
  app.useStaticAssets(join(process.cwd(), 'static', 'cafes'), {
    prefix: '/static/cafes',
  });

  const frontendOrigins = parseFrontendOrigins();
  const isDev = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          if (frontendOrigins.includes(origin) || isDevLanOrigin(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      : frontendOrigins.length === 1
        ? frontendOrigins[0]
        : frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Canlı Müzik Nerede API')
    .setDescription('Canlı Müzik Nerede Projesi API Dokümantasyonu')
    .setVersion('1.0')
    .addTag('muzik')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger /api adresinde çalışacak

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();