import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips/:id/schedules', () => {
    test('returns all schedules for a valid trip', async () => {
        const response = await request(app)
            .get('/api/trips/alpine-panorama/schedules');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body).toHaveLength(2);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 1,
                    tripId: 'alpine-panorama',
                    departureTime: '08:30',
                    arrivalTime: '13:00',
                }),
                expect.objectContaining({
                    id: 2,
                    tripId: 'alpine-panorama',
                    departureTime: '13:15',
                    arrivalTime: '17:45',
                }),
            ])
        );
    });

    test('returns schedules for an operating month', async () => {
        const response = await request(app)
            .get('/api/trips/alpine-panorama/schedules?month=4');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
    });

    test('returns an empty array for a non-operating month', async () => {
        const response = await request(app)
            .get('/api/trips/alpine-panorama/schedules?month=1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('returns 400 for an invalid month', async () => {
        const response = await request(app)
            .get('/api/trips/alpine-panorama/schedules?month=13');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Month must be a number between 1 and 12.',
        });
    });

    test('returns 404 when the trip does not exist', async () => {
        const response = await request(app)
            .get('/api/trips/unknown-trip/schedules');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Trip not found.',
        });
    });
});
