# Spec: Feature Set 1 - Trip List, PR 1: Pagination

## Description
Add pagination to GET /api/trips and to the /trips page. The page shows 10 trips at a time with Previous and Next controls. The list is still filled in by client-side JavaScript that calls the API.

## Data model
Collection trips (unchanged): id, name, description, region, startStation, endStation, duration, distance, highlights, bestSeason, operatingMonths, imageUrl.

## API: GET /api/trips
Query parameters:
- page: whole number, default 1, minimum 1
- limit: whole number, default 10, minimum 1, maximum 50
- sort: one of name, region, distance, bestSeason (default name)
- order: asc or desc (default asc)

Response 200:
{
  "data": [ ...trips ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 6, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false },
  "query": { "sort": "name", "order": "asc" }
}

Errors:
- 400: { "errors": [ { "field": "limit", "message": "limit must be a whole number between 1 and 50." } ] } for a page that is not a whole number of 1 or more, a limit outside 1-50, an unsupported sort, or an order other than asc or desc.
- 500: { "error": "Failed to fetch trips" }

A page past the last page returns 200 with an empty data array. Swagger documents every query parameter, with its default and allowed values.

## Files
- src/models/trips.js: getPaginatedTrips({ page, limit, sort, order }) using skip(), limit() and countDocuments(), with id as a tie-breaker so the order stays stable between pages
- src/controllers/trips.js: getAllTrips validates the query, builds the metadata and returns 400 for invalid values
- src/routes/api-routes.js: Swagger docs for page, limit, sort and order
- src/views/trips/list.ejs and public/js/trips.js: pagination controls, page and limit read from the address bar
- tests/trips.test.js: 12 pagination tests

## Page behavior
- /trips shows 10 trips per page by default, with Previous, Next and "Page X of Y (N trips)". A button is disabled when there is no previous or next page.
- /trips also accepts ?page= and ?limit= (limit is capped at 50, invalid values fall back to the defaults), so pagination can be shown with only 6 trips, for example /trips?limit=2.
- A page past the end (for example ?page=99) loads the last page.
- Changing pages does not reload the browser, and the Back and Forward buttons work.
- The region and season dropdowns are removed in this PR and come back in PR 2, when the server does the filtering.
- The loading and error messages are kept.

## Test plan
1. GET /api/trips returns data and pagination metadata (200).
2. GET /api/trips?limit=2 returns 2 trips, totalItems 6 and totalPages 3.
3. GET /api/trips?limit=2&page=2 returns different trips than page 1.
4. GET /api/trips?page=abc, ?page=0, ?limit=0, ?limit=51 and ?limit=-5 return 400.
5. GET /api/trips?sort=password and ?order=up return 400.
6. GET /api/trips?sort=distance&order=desc changes the order.
7. GET /api/trips?page=99 returns 200 with an empty data array.
8. /trips?limit=2 shows 2 trips, and Previous and Next work without a page reload.
9. The browser's Back button goes to the previous page.
10. /trips shows an error message if the API fails.
11. npm run lint and npm test report no errors.