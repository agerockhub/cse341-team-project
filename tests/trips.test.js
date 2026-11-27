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

    test('a page number that is too large returns 400', async () => {
        const response = await request(app).get('/api/trips?page=99999999999999999999');

        expect(response.status).toBe(400);
        expect(response.body.errors[0].field).toBe('page');
    });
});

describe('GET /api/trips filters and search', () => {
    const idsFor = async (query) => {
        const response = await request(app).get('/api/trips').query(query);
        return { response, ids: response.body.data.map((trip) => trip.id).sort() };
    };

    test('region returns only that region and counts only the matches', async () => {
        const { response, ids } = await idsFor({ region: 'central' });

        expect(response.status).toBe(200);
        expect(ids).toEqual(['alpine-panorama', 'gorge-explorer']);
        expect(response.body.pagination.totalItems).toBe(2);
        expect(response.body.query.region).toBe('central');
    });

    test('season returns only trips whose best season matches', async () => {
        const { ids } = await idsFor({ season: 'autumn' });

        expect(ids).toEqual(['alpine-panorama', 'gorge-explorer', 'romantic-gorge']);
    });

    test('q searches names and descriptions without caring about case', async () => {
        const lower = await idsFor({ q: 'gorge' });
        const upper = await idsFor({ q: 'GORGE' });

        expect(lower.ids).toEqual(['gorge-explorer', 'romantic-gorge']);
        expect(upper.ids).toEqual(lower.ids);
    });

    test('region, season and q combine', async () => {
        const { ids } = await idsFor({ region: 'central', season: 'autumn', q: 'alpine' });

        expect(ids).toEqual(['alpine-panorama']);
    });

    test('filters work with pagination and count only the matches', async () => {
        const response = await request(app).get('/api/trips').query({ season: 'autumn', limit: 2 });

        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.totalItems).toBe(3);
        expect(response.body.pagination.totalPages).toBe(2);
        expect(response.body.pagination.hasNextPage).toBe(true);
    });

    test('no matches returns 200 with an empty array', async () => {
        const { response } = await idsFor({ q: 'zzzzzz' });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination.totalItems).toBe(0);
        expect(response.body.pagination.totalPages).toBe(0);
    });

    test('special characters in q are treated as plain text', async () => {
        const { response } = await idsFor({ q: '(' });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });

    test.each([
        'region=mars',
        'season=monsoon',
        'q=',
        'q=%20%20',
        'q=a&q=b',
        `q=${'a'.repeat(101)}`
    ])('invalid query %s returns 400 with an errors list', async (query) => {
        const response = await request(app).get(`/api/trips?${query}`);

        expect(response.status).toBe(400);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });
});