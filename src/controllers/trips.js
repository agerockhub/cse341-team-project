
// src/controllers/trips.js
import {
    getTripById as findTripById,
    getPaginatedTrips,
} from "../models/trips.js";

const TRIP_SORT_FIELDS = ["name", "region", "distance", "bestSeason"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Query values arrive as strings (or arrays). Returns null when a value is not a whole number of 1 or more.
const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return null;
    }
    const parsed = Number(value);
    return parsed >= 1 ? parsed : null;
};

// ---- API controllers (JSON) ----

export async function getTripById(req, res) {
    try {
        const { id } = req.params;

        const trip = await findTripById(id);

        if (!trip) {
            return res.status(404).json({
                error: "Trip not found",
            });
        }

        return res.status(200).json(trip);
    } catch (error) {
        console.error("Error fetching trip:", error);

        return res.status(500).json({
            error: "Failed to fetch trip",
        });
    }
}

export async function getAllTrips(req, res) {
    const errors = [];

    const page = parsePositiveInteger(req.query.page, 1);
    if (page === null) {
        errors.push({ field: "page", message: "page must be a whole number of 1 or more." });
    }

    const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);
    if (limit === null || limit > MAX_LIMIT) {
        errors.push({ field: "limit", message: `limit must be a whole number between 1 and ${MAX_LIMIT}.` });
    }

    const sort = req.query.sort === undefined ? "name" : req.query.sort;
    if (!TRIP_SORT_FIELDS.includes(sort)) {
        errors.push({ field: "sort", message: `sort must be one of: ${TRIP_SORT_FIELDS.join(", ")}.` });
    }

    const orderText = req.query.order === undefined ? "asc" : req.query.order;
    if (!["asc", "desc"].includes(orderText)) {
        errors.push({ field: "order", message: "order must be asc or desc." });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const { trips, totalItems } = await getPaginatedTrips({
            page,
            limit,
            sort,
            order: orderText === "desc" ? -1 : 1,
        });

        return res.status(200).json({
            data: trips,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                hasNextPage: page * limit < totalItems,
                hasPreviousPage: page > 1,
            },
            query: { sort, order: orderText },
        });
    } catch (error) {
        console.error("Error fetching trips:", error);

        return res.status(500).json({
            error: "Failed to fetch trips",
        });
    }
}

// ---- EJS page controllers ----

// The trip list is filled in by client-side JavaScript, so no data is needed here.
export function tripListPage(req, res) {
    res.render("trips/list", { title: "Scenic Train Trips" });
}

export async function tripDetailsPage(req, res, next) {
    try {
        const { tripId } = req.params;
        const details = await findTripById(tripId);

        if (!details) {
            const error = new Error("Trip Not Found");
            error.status = 404;
            return next(error);
        }

        return res.render("trips/details", {
            title: "Trip Details",
            details,
        });
    } catch (error) {
        return next(error);
    }
}
