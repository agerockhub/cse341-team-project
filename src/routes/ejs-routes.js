// src/routes/ejs-routes.js
import { Router } from 'express';
import { tripListPage, tripDetailsPage } from '../controllers/trips.js';
import {
    bookingPage,
    processBookingRequest,
    bookingConfirmationPage,
    bookingsAdminPage,
} from '../controllers/bookings.js';

const router = Router();

// Trip list page (filled in by client-side JavaScript)
router.get('/trips', tripListPage);

// Trip details page
router.get('/trips/:tripId', tripDetailsPage);

// Booking flow
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', bookingConfirmationPage);

// Bookings admin page (filled in by client-side JavaScript)
router.get('/bookings-admin', bookingsAdminPage);

export default router;