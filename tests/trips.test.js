import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips pagination', () => {
    test('returns data and pagination metadata with the defaults', async () => {
        const response = await request(app).get('/api/trips');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(6);
        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 6,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
        });
        expect(response.body.query).toEqual({ sort: 'name', order: 'asc' });
    });

    test('limit splits the results into pages', async () => {
        const response = await request(app).get('/api/trips?limit=2');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.totalPages).toBe(3);
        expect(response.body.pagination.hasNextPage).toBe(true);
        expect(response.body.pagination.hasPreviousPage).toBe(false);
    });

    test('the second page returns different trips than the first', async () => {
        const first = await request(app).get('/api/trips?limit=2&page=1');
        const second = await request(app).get('/api/trips?limit=2&page=2');
        const firstIds = first.body.data.map((trip) => trip.id);
        const secondIds = second.body.data.map((trip) => trip.id);

        expect(secondIds).toHaveLength(2);
        expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
        expect(second.body.pagination.hasPreviousPage).toBe(true);
    });

    test('a page past the last page returns an empty data array', async () => {
        const response = await request(app).get('/api/trips?page=99');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

    test('sort and order change the order of the results', async () => {
        const response = await request(app).get('/api/trips?sort=distance&order=desc');
        const distances = response.body.data.map((trip) => trip.distance);

        expect(response.status).toBe(200);
        expect(distances).toEqual([...distances].sort((a, b) => b - a));
    });

    test.each([
        'page=abc',
        'page=0',
        'limit=0',
        'limit=51',
        'limit=-5',
        'sort=password',
        'order=up'
    ])('invalid query %s returns 400 with an errors list', async (query) => {
        const response = await request(app).get(`/api/trips?${query}`);

        expect(response.status).toBe(400);
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });
});