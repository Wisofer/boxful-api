import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createRequire } from 'module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureApplication } from './../src/configure-app';

jest.setTimeout(60_000);

const requireFn = createRequire(__filename);

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongoMemoryServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoMemoryServer.getUri();
  });

  afterAll(async () => {
    await mongoMemoryServer.stop();
  });

  beforeEach(async () => {
    const appRoot = requireFn(
      '../src/app.module',
    ) as typeof import('../src/app.module');
    const { AppModule } = appRoot;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it('/api (GET)', () =>
    request(app.getHttpServer() as Server)
      .get('/api')
      .expect(200)
      .expect('Hello World!'));

  afterEach(async () => {
    await app?.close();
  });
});
