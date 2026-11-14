import schedule from "./schemas/schedules.js";
import trip from "./schemas/trips.js";

/**
 * Get all schedules for a specific trip.
 * Optionally filter by the trip's operating month.
 *
 * @param {string} tripId - The custom ID of the trip.
 * @param {number} [month] - Optional month number (1-12).
 * @returns {Promise<Array>} Matching schedules.
 */
export async function getSchedulesByTripId(tripId, month) {
    // Check whether the requested trip exists.
    const tripDetails = await trip.findOne({ id: tripId }).lean();

    if (!tripDetails) {
        return null;
    }

    // If a month is supplied, check whether the trip operates then.
if (month !== undefined) {
    if (!tripDetails.operatingMonths?.includes(month)) {
        return [];
    }
}

    // Retrieve schedules belonging to the trip.
    return schedule.find({ tripId }).sort({ departureTime: 1 }).lean();
}
