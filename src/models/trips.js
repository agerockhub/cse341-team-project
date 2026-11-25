// src/models/trips.js
import trip from "./schemas/trips.js";

export async function getTripById(id) {
    return trip.findOne({ id }).lean();
}

export async function getAllTrips() {
    return trip.find({}).lean();
}

export async function getPaginatedTrips({ page, limit, sort, order }) {
    const skip = (page - 1) * limit;
    // The id is a tie-breaker, so trips with the same sort value keep a stable order between pages.
    const sortOptions = { [sort]: order, id: 1 };

    const [trips, totalItems] = await Promise.all([
        trip.find({}).sort(sortOptions).skip(skip).limit(limit).lean(),
        trip.countDocuments({}),
    ]);

    return { trips, totalItems };
}