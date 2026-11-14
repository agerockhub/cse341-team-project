import { getSchedulesByTripId } from "../models/schedules.js";

/**
 * Get schedules for a trip, optionally filtered by month.
 */
export async function getSchedulesForTrip(req, res) {
    try {
        const { id } = req.params;
        const month = req.query.month;

        // Validate the month if supplied.
        if (month !== undefined) {
            const monthNumber = Number(month);

            if (
                !Number.isInteger(monthNumber) ||
                monthNumber < 1 ||
                monthNumber > 12
            ) {
                return res.status(400).json({
                    error: "Month must be a number between 1 and 12.",
                });
            }

            const schedules = await getSchedulesByTripId(id, monthNumber);

            if (schedules === null) {
                return res.status(404).json({
                    error: "Trip not found.",
                });
            }

            return res.status(200).json(schedules);
        }

        const schedules = await getSchedulesByTripId(id);

        if (schedules === null) {
            return res.status(404).json({
                error: "Trip not found.",
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules.",
        });
    }
}

