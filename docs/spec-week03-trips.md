# Spec: Feature Set 1 - Trips

## Description
Move trip data access to Mongoose and expose it through JSON API endpoints, following the existing trains example. The trip list page loads its trips with client-side JavaScript from the API instead of EJS loops. The trip details EJS controller uses the new trips model function.

## Data model (collection: trips, Mongoose model "Trip")
| Field | Type | Required | Notes |
|---|---|---|---|
| id | String | yes | unique custom id, e.g. "alpine-panorama" |
| name | String | yes | |
| description | String | no | |
| region | String | yes | e.g. "central", "kansai" |
| startStation | String | yes | station id, e.g. "nagoya" |
| endStation | String | yes | station id, e.g. "toyama" |
| duration | String | no | e.g. "4.5 hours" |
| distance | Number | no | |
| highlights | [String] | no | |
| bestSeason | String | no | e.g. "autumn" |
| operatingMonths | [Number] | no | months 1-12 |
| imageUrl | String | no | |

Timestamps (createdAt, updatedAt) are added by Mongoose.

## Files
- src/models/schemas/trips.js: Mongoose schema
- src/models/trips.js: getAllTrips, getTripById
- src/controllers/trips.js: API controllers getAllTrips, getTripById; EJS controllers for the list and details pages
- src/routes/api-routes.js: /api/trips and /api/trips/{id} with Swagger docs
- src/routes/ejs-routes.js: trips EJS routes
- src/views/trips/list.ejs: hydrated with client-side JavaScript (same pattern as trains.ejs)

## API endpoints
GET /api/trips
- 200: array of trips
- 500: { "error": "Failed to fetch trips" }

GET /api/trips/{id}
- 200: one trip object
- 404: { "error": "Trip not found" }
- 500: { "error": "Failed to fetch trip" }

## Test plan
1. GET /api/trips returns 200 and all 6 trips.
2. GET /api/trips/alpine-panorama returns 200 and that trip.
3. GET /api/trips/not-a-trip returns 404.
4. /trips shows "Loading trips..." and then the trip cards, filled in by JavaScript.
5. /trips shows an error message if the API call fails.
6. /trips/alpine-panorama still opens and shows the right trip.
7. npm run lint reports no errors.