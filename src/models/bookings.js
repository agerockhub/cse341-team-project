// src/models/bookings.js
import booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
    const created = await booking.create(bookingData);
    return created.toObject();
}

export async function getAllBookings() {
    return booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
    return booking.findOne({ id }).lean();
}