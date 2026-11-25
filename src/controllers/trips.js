
// src/controllers/trips.js
import {
    getTripById as findTripById,
    getPaginatedTrips,
} from "../models/trips.js";

const TRIP_SORT_FIELDS = ["name", "region", "distance", "bestSeason"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const MAX_SEARCH_LENGTH = 100;
const TRIP_REGIONS = ["central", "northern", "kansai", "hokkaido"];
const TRIP_SEASONS = ["spring", "summer", "autumn", "winter"];

// Makes characters such as ( or . plain text, so they cannot break the search pattern.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query values arrive as strings (or arrays). Returns null when a value is not a whole number of 1 or more.
const parsePositiveInteger = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return null;
    }
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
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

    const { region, season, q } = req.query;

    if (region !== undefined && !TRIP_REGIONS.includes(region)) {
        errors.push({ field: "region", message: `region must be one of: ${TRIP_REGIONS.join(", ")}.` });
    }

    if (season !== undefined && !TRIP_SEASONS.includes(season)) {
        errors.push({ field: "season", message: `season must be one of: ${TRIP_SEASONS.join(", ")}.` });
    }

    let searchText;
    if (q !== undefined) {
        searchText = typeof q === "string" ? q.trim() : "";
        if (!searchText || searchText.length > MAX_SEARCH_LENGTH) {
            errors.push({
                field: "q",
                message: `q must be one piece of text between 1 and ${MAX_SEARCH_LENGTH} characters.`,
            });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Build a new filter from the accepted values. req.query is never passed to Mongoose directly.
    const filter = {};
    if (region) {
        filter.region = region;
    }
    if (season) {
        filter.bestSeason = season;
    }
    if (searchText) {
        const pattern = new RegExp(escapeRegex(searchText), "i");
        filter.$or = [{ name: pattern }, { description: pattern }];
    }

    try {
        const { trips, totalItems } = await getPaginatedTrips({
            filter,
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
            query: { q: searchText, region, season, sort, order: orderText },
        });
    } catch (error) {
        console.error("Error fetching trips:", error);

        return res.status(500).json({
            error: "Failed to fetch trips",
        });
    }
}

// ---- EJS page controllers ----

// The trips come from the API, but the dropdown choices are rendered here.
export function tripListPage(req, res) {
    res.render("trips/list", {
        title: "Scenic Train Trips",
        regions: TRIP_REGIONS,
        seasons: TRIP_SEASONS,
    });
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
