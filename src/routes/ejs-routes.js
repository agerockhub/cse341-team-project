// src/routes/ejs-routes.js
import { Router } from 'express';
import { tripListPage, tripDetailsPage } from '../controllers/trips.js';

const router = Router();

// Trip list page (filled in by client-side JavaScript)
router.get('/trips', tripListPage);

// Trip details page
router.get('/trips/:tripId', tripDetailsPage);

export default router;