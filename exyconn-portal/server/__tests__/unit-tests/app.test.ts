import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';

describe('createApp', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  it('answers the health check without a session', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('serves GraphQL to an anonymous caller', async () => {
    const res = await request(app).post('/graphql').send({ query: '{ _empty }' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { _empty: null } });
  });

  it('treats a forged token as nobody rather than failing the request', async () => {
    const res = await request(app)
      .post('/graphql')
      .set('Authorization', 'Bearer forged.token.value')
      .send({ query: '{ _empty }' });
    expect(res.body.data).toEqual({ _empty: null });
  });

  it('publishes the schema outside production', async () => {
    expect(env.isProduction).toBe(false);
    const res = await request(app)
      .post('/graphql')
      .send({ query: '{ __schema { queryType { name } } }' });
    expect(res.body.data.__schema.queryType.name).toBe('Query');
  });

  it('allows a configured portal origin with credentials', async () => {
    const [origin] = env.corsOrigins;
    const res = await request(app).get('/health').set('Origin', origin);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not grant an unknown origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
