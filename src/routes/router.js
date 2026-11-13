import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import ejsRoutes from './ejs-routes.js';
import apiRoutes from './api-routes.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// EJS page routes and API routes
router.use('/', ejsRoutes);
router.use('/', apiRoutes);

// Booking and confirmation routes (owned by the Bookings feature)
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;