const { createApp } = require('../src/createApp');
const request = require('supertest');

function buildApp(env) {
  // 環境変数設定
  process.env.BASIC_AUTH_ENABLED = env.BASIC_AUTH_ENABLED;
  process.env.AUTH_USER = env.AUTH_USER || 'admin';
  process.env.AUTH_PASSWORD = env.AUTH_PASSWORD || 'password123';
  // モジュールキャッシュクリア (createApp依存のみに絞る)
  delete require.cache[require.resolve('../src/createApp')];
  return require('../src/createApp').createApp();
}

describe('BASIC_AUTH_ENABLED behaviour', () => {
  const endpoint = '/api/bookmarks';

  test('BASIC_AUTH_ENABLED=true -> requires auth (401)', async () => {
    const app = buildApp({ BASIC_AUTH_ENABLED: 'true', AUTH_USER: 'admin', AUTH_PASSWORD: 'secret123' });
    const res = await request(app).get(endpoint);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });

  test('BASIC_AUTH_ENABLED=false -> no auth required (200)', async () => {
    const app = buildApp({ BASIC_AUTH_ENABLED: 'false' });
    const res = await request(app).get(endpoint);
    expect(res.status).toBe(200); // 認証不要
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Authenticated request succeeds when enabled', async () => {
    const app = buildApp({ BASIC_AUTH_ENABLED: 'true', AUTH_USER: 'admin', AUTH_PASSWORD: 'pass123' });
    const auth = Buffer.from('admin:pass123').toString('base64');
    const res = await request(app).get(endpoint).set('Authorization', `Basic ${auth}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
