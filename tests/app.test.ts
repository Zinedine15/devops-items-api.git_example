import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp, type Database, type Item } from '../src/app';

class FakeDatabase implements Database {
  public items: Item[] = [];
  public failQueries = false;
  private nextId = 1;

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }> {
    if (this.failQueries) throw new Error('simulated database outage');

    if (sql === 'SELECT 1') return { rows: [{ '?column?': 1 } as unknown as T] };
    if (sql.startsWith('INSERT INTO items')) {
      const item: Item = {
        id: this.nextId++,
        name: String(values?.[0]),
        description: String(values?.[1]),
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      };
      this.items.push(item);
      return { rows: [item as unknown as T] };
    }
    if (sql.startsWith('SELECT id, name, description, created_at FROM items')) {
      return { rows: [...this.items] as unknown as T[] };
    }

    throw new Error(`Unexpected query in test: ${sql}`);
  }
}

test('GET /health returns 200 when database query succeeds', async () => {
  const database = new FakeDatabase();
  const response = await request(createApp(database)).get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 'connected' });
});

test('GET /health returns 503 when database query fails', async () => {
  const database = new FakeDatabase();
  database.failQueries = true;
  const response = await request(createApp(database)).get('/health');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'error', database: 'disconnected' });
});

test('POST /items validates required strings and rejects blank values', async () => {
  const response = await request(createApp(new FakeDatabase()))
    .post('/items')
    .send({ name: '  ', description: 42 });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Validation error');
  assert.ok(response.body.details.name);
  assert.ok(response.body.details.description);
});

test('POST /items trims and persists valid data', async () => {
  const database = new FakeDatabase();
  const response = await request(createApp(database))
    .post('/items')
    .send({ name: '  teclado  ', description: '  Teclado mecánico  ' });
  assert.equal(response.status, 201);
  assert.equal(response.body.name, 'teclado');
  assert.equal(response.body.description, 'Teclado mecánico');
  assert.equal(database.items.length, 1);
});

test('GET /items returns the full stored list', async () => {
  const database = new FakeDatabase();
  await request(createApp(database)).post('/items').send({ name: 'Mouse', description: 'USB' });
  const response = await request(createApp(database)).get('/items');
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].name, 'Mouse');
});
