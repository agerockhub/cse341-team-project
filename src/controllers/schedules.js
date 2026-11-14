import { getSchedulesByTripId } from "../models/schedules.js";

/**
 * Get all schedules for a specific trip.
 */
export async function getSchedulesForTrip(req, res) {
    try {
        const { id } = req.params;

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

/**
 * Get schedules for a specific trip and month.
 */
export async function getSchedulesForTripAndMonth(req, res) {
    try {
        const { id } = req.params;
        const month = Number(req.query.month);

        // Validate the requested month.
        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12
        ) {
            return res.status(400).json({
                error: "Month must be a number between 1 and 12.",
            });
        }

        const schedules = await getSchedulesByTripId(id, month);

        if (schedules === null) {
            return res.status(404).json({
                error: "Trip not found.",
            });
        }

        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Error fetching schedules by month:", error);

        return res.status(500).json({
            error: "Failed to fetch schedules.",
        });
    }
}
