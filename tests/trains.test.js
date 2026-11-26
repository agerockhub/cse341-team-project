import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns a successful JSON response with pagination metadata', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBeInstanceOf(Array);

    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        currentPage: 1,
        limit: 10,
        totalItems: expect.any(Number),
        totalPages: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean),
      })
    );
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(4);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric',
        }),
      ])
    );
  });

  test('limit splits the trains into pages', async () => {
    const firstPage = await request(app)
      .get('/api/trains?page=1&limit=2&sort=name&order=asc');

    const secondPage = await request(app)
      .get('/api/trains?page=2&limit=2&sort=name&order=asc');

    expect(firstPage.status).toBe(200);
    expect(secondPage.status).toBe(200);

    expect(firstPage.body.data).toHaveLength(2);
    expect(secondPage.body.data).toHaveLength(2);

    expect(firstPage.body.pagination.currentPage).toBe(1);
    expect(firstPage.body.pagination.totalPages).toBe(2);
    expect(firstPage.body.pagination.hasNextPage).toBe(true);
    expect(firstPage.body.pagination.hasPreviousPage).toBe(false);

    expect(secondPage.body.pagination.currentPage).toBe(2);
    expect(secondPage.body.pagination.totalPages).toBe(2);
    expect(secondPage.body.pagination.hasNextPage).toBe(false);
    expect(secondPage.body.pagination.hasPreviousPage).toBe(true);

    const firstPageIds = firstPage.body.data.map((train) => train.id);
    const secondPageIds = secondPage.body.data.map((train) => train.id);

    expect(firstPageIds).not.toEqual(secondPageIds);
  });

  test('returns 400 for an invalid page number', async () => {
    const response = await request(app).get('/api/trains?page=0');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'page',
        }),
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway',
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express',
        }),
      ])
    );
  });
});
