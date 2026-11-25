// src/routes/api-routes.js
import { Router } from 'express';
import { getAllTrips, getTripById } from '../controllers/trips.js';
import {
    getSchedulesForTrip,
    getSchedulesForTripAndMonth,
} from '../controllers/schedules.js';
import {
    getAllBookings,
    getMyBookings,
} from '../controllers/bookings.js';
import {
    requireApiLogin,
    requireApiRole,
} from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get trips, one page at a time, with optional filters and search
 *     tags: [Trips]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, region, distance, bestSeason]
 *           default: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [central, northern, kansai, hokkaido]
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [spring, summer, autumn, winter]
 *       - in: query
 *         name: q
 *         description: Searches trip names and descriptions (case-insensitive, 1 to 100 characters).
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: A page of matching trips with pagination metadata (data, pagination, query). No matches returns an empty data array.
 *       400:
 *         description: Invalid page, limit, sort, order, region, season or q
 *       500:
 *         description: Failed to fetch trips
 */
router.get('/api/trips', getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by its id
 *     tags: [Trips]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *     responses:
 *       200:
 *         description: The trip
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 */
router.get('/api/trips/:id', getTripById);

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a specific trip
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: alpine-panorama
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         example: 4
 *         description: Optional month number used to filter by the trip's operating months
 *     responses:
 *       200:
 *         description: List of schedules for the trip
 *       400:
 *         description: Invalid month parameter
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch schedules
 */
router.get('/api/trips/:id/schedules', (req, res, next) => {
    if (req.query.month !== undefined) {
        return getSchedulesForTripAndMonth(req, res, next);
    }

    return getSchedulesForTrip(req, res, next);
});

/**
 * @swagger
 * /api/bookings/me:
 *   get:
 *     summary: Get bookings belonging to the logged-in user
 *     description: Requires an authenticated session.
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: The user's bookings
 *       401:
 *         description: Not signed in
 *       500:
 *         description: Failed to fetch bookings
 */
router.get('/api/bookings/me', requireApiLogin, getMyBookings);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings (admin only)
 *     description: Requires a signed-in admin session (session cookie).
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: A list of all bookings
 *       401:
 *         description: Not signed in
 *       403:
 *         description: Signed in but not an admin
 *       500:
 *         description: Failed to fetch bookings
 */
router.get('/api/bookings', requireApiRole('admin'), getAllBookings);

export default router;
