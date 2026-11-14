// src/controllers/bookings.js
import { getDb } from "../db/connect.js";
import { generateConfirmationCode } from "../includes/helpers.js";
import { getTripById as findTripById } from "../models/trips.js";
import {
    createBooking,
    getAllBookings as findAllBookings,
    getBookingById as findBookingById,
} from "../models/bookings.js";

// ---- API controller (JSON) ----

export async function getAllBookings(req, res) {
    try {
        const bookings = await findAllBookings();

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);

        return res.status(500).json({
            error: "Failed to fetch bookings",
        });
    }
}

// ---- EJS page controllers ----

export async function bookingPage(req, res, next) {
    try {
        const { scheduleId } = req.params;
        const db = getDb();

        const schedule = await db
            .collection("schedules")
            .findOne({ id: Number(scheduleId) });

        if (!schedule) {
            const error = new Error("Schedule Not Found");
            error.status = 404;
            return next(error);
        }

        const trip = await findTripById(schedule.tripId);

        if (!trip) {
            const error = new Error("Trip Not Found");
            error.status = 404;
            return next(error);
        }

        const ticketClasses = await db.collection("ticketClasses").find({}).toArray();
        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description,
        }));

        return res.render("trips/book", {
            title: "Book Trip",
            schedule,
            ticketOptions,
        });
    } catch (error) {
        return next(error);
    }
}

export async function processBookingRequest(req, res, next) {
    try {
        const { scheduleId, tripId, ticketClass, selectedDay, passengers } = req.body;

        const booking = await createBooking({
            id: generateConfirmationCode(),
            scheduleId,
            tripId,
            ticketClass,
            selectedDay,
            passengers: Array.isArray(passengers)
                ? passengers
                : Object.values(passengers || {}),
        });

        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        if (error.name === "ValidationError") {
            error.status = 400;
        }
        return next(error);
    }
}

export async function bookingConfirmationPage(req, res, next) {
    try {
        const { confirmationId } = req.params;
        const booking = await findBookingById(confirmationId);

        if (!booking) {
            const error = new Error("Booking Not Found");
            error.status = 404;
            return next(error);
        }

        // The confirm.ejs view still names this variable "confirmation".
        return res.render("trips/confirm", {
            title: "Trip Confirmation",
            confirmation: booking,
        });
    } catch (error) {
        return next(error);
    }
}

export function bookingsAdminPage(req, res) {
    res.render("bookings", { title: "Bookings Admin" });
}