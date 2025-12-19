import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix("api");

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        // enableImplicitConversion: true,
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle("API Documentation")
    .setDescription("Monorepo API documentation")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3001);
  console.log("Backend is running on http://localhost:3001");
  console.log("Swagger docs available at http://localhost:3001/api/docs");
}

bootstrap();
