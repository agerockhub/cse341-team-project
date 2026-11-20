// src/routes/ejs-routes.js
import { Router } from 'express';
import { tripListPage, tripDetailsPage } from '../controllers/trips.js';
import {
    bookingPage,
    processBookingRequest,
    bookingConfirmationPage,
    bookingsAdminPage,
} from '../controllers/bookings.js';
import {
    registerPage,
    register,
    loginPage,
    login,
    logout,
    adminDashboardPage,
} from '../controllers/auth.js';
import {
    requirePageLogin,
    requirePageRole,
} from '../middleware/auth.js';
import { dashboardPage } from '../controllers/dashboard.js';

const router = Router();

// Trip list page (filled in by client-side JavaScript)
router.get('/trips', tripListPage);

// Trip details page
router.get('/trips/:tripId', tripDetailsPage);

// Booking flow
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', bookingConfirmationPage);

// Bookings admin page (admin only)
router.get('/bookings-admin', requirePageRole('admin'), bookingsAdminPage);

// Authentication
router.get('/register', registerPage);
router.post('/register', register);
router.get('/login', loginPage);
router.post('/login', login);
router.post('/logout', logout);

// Customer dashboard (authenticated users only)
router.get('/dashboard', requirePageLogin, dashboardPage);

// Admin dashboard (admin only)
router.get('/admin-dashboard', requirePageRole('admin'), adminDashboardPage);

export default router;
