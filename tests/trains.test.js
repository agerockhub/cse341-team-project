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

  test('searches trains by keyword in their name', async () => {
    const response = await request(app).get('/api/trains?q=KiHa');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'kiha-261',
        name: 'KiHa 261 North Scenic',
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('searches trains by descriptive information', async () => {
    const response = await request(app).get('/api/trains?q=Winter');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'kiha-261',
        name: 'KiHa 261 North Scenic',
      })
    );
  });

  test('filters trains by type', async () => {
    const response = await request(app).get(
      '/api/trains?type=Limited%20Express'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Series 287 Coastal Arrow',
          type: 'Limited Express',
        }),
        expect.objectContaining({
          name: 'Series E353 Limited Express',
          type: 'Limited Express',
        }),
      ])
    );
  });

  test('filters trains by power source', async () => {
    const response = await request(app).get('/api/trains?powerSource=Diesel');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'kiha-261',
        powerSource: 'Diesel',
      })
    );
  });

  test('combines keyword search and power source filter', async () => {
    const response = await request(app).get(
      '/api/trains?q=Winter&powerSource=Diesel'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: 'kiha-261',
        name: 'KiHa 261 North Scenic',
        powerSource: 'Diesel',
      })
    );

    expect(response.body.pagination.totalItems).toBe(1);
  });

  test('returns an empty result when no trains match the search', async () => {
    const response = await request(app).get(
      '/api/trains?q=NonexistentTrain'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.totalItems).toBe(0);
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

  test('pagination works together with search filters', async () => {
    const response = await request(app).get(
      '/api/trains?type=Limited%20Express&page=1&limit=1'
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.pagination).toEqual(
      expect.objectContaining({
        currentPage: 1,
        limit: 1,
        totalItems: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      })
    );
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

  test('returns 400 when limit is zero', async () => {
    const response = await request(app).get('/api/trains?limit=0');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'limit',
        }),
      ])
    );
  });

  test('returns 400 when limit exceeds the maximum of 50', async () => {
    const response = await request(app).get('/api/trains?limit=51');

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'limit',
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
