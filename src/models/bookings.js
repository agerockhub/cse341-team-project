
// src/models/bookings.js
import booking from "./schemas/bookings.js";

export async function createBooking(bookingData) {
    const created = await booking.create(bookingData);
    return created.toObject();
}

export async function getAllBookings() {
    return booking.find({}).sort({ createdAt: -1 }).lean();
}

// Retrieve bookings containing a passenger with the specified email.
export async function getBookingsByPassengerEmail(email) {
    return booking
        .find({
            "passengers.email": email.trim().toLowerCase(),
        })
        .sort({ createdAt: -1 })
        .lean();
}

export async function getBookingById(id) {
    return booking.findOne({ id }).lean();
}
