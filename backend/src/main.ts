import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Simple video file serving
  const express = require('express');
  app.use('/videos', express.static('/downloads', {
    setHeaders: (res, path) => {
      res.set('Accept-Ranges', 'bytes');
      if (path.endsWith('.mp4')) {
        res.set('Content-Type', 'video/mp4');
      }
    }
  }));

  app.enableCors({
    origin: ['http://localhost:3001', 'http://frontend:3000'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Hypertube API')
    .setDescription('Video streaming platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Hypertube API running on port ${port}`);
  console.log(`📖 Swagger documentation: http://localhost:${port}/api`);
}

bootstrap();