# Spec: Feature Set 1 - Trip List, PR 2: Search and Filtering

## Description
Add server-side filtering by region and season, and keyword search over trip names and descriptions, to GET /api/trips. The /trips page gets its region and season dropdowns back, plus a search box, and the results stay paginated. This builds on PR 1 (pagination).

## API: GET /api/trips (new query parameters, added to page, limit, sort and order)
- region: one of central, northern, kansai, hokkaido
- season: one of spring, summer, autumn, winter
- q: search text, 1 to 100 characters after trimming. Matches any trip whose name or description contains the text (case-insensitive).
All filters combine (AND), and the pagination metadata counts only the matching trips.

Response 200:
{
  "data": [ ...trips ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 2, "totalPages": 1, "hasNextPage": false, "hasPreviousPage": false },
  "query": { "q": "gorge", "region": "central", "season": "autumn", "sort": "name", "order": "asc" }
}
A search with no matches returns 200 with an empty data array and totalItems 0, not 404.

Errors (400, { "errors": [ { "field": "...", "message": "..." } ] }):
- region or season is not one of the allowed values
- q is not a single string, is empty after trimming, or is longer than 100 characters
- plus all the PR 1 validation (page, limit, sort, order)
500: { "error": "Failed to fetch trips" }

## Files
- src/models/trips.js: getPaginatedTrips accepts a filter built from validated values
- src/controllers/trips.js: validates region, season and q, builds the filter, and passes the allowed region and season lists to the page
- src/routes/api-routes.js: Swagger docs for region, season and q
- src/views/trips/list.ejs and public/js/trips.js: dropdowns, search box, and pagination that keeps the filters
- tests/trips.test.js: tests for filtering, searching and validation

## Page behavior
- Changing a dropdown or searching goes back to page 1.
- The page, filters and search text are kept in the address bar (for example /trips?region=central&q=gorge), so Back and Forward work.
- "No trips match your filters." appears when nothing matches.
- The search text is escaped before it is used in the database query, so characters such as . or ( are treated as plain text.

## Test plan
1. GET /api/trips?region=kansai returns only kansai trips, and totalItems counts only those.
2. GET /api/trips?season=autumn returns only autumn trips.
3. GET /api/trips?q=gorge returns trips with "gorge" in the name or description, case-insensitively.
4. GET /api/trips?region=central&season=autumn&q=alpine combines all three.
5. GET /api/trips?q=zzzzzz returns 200 with an empty data array.
6. region=mars, season=monsoon, an empty q and a q of over 100 characters return 400.
7. Filters work together with limit and page, and the metadata counts only the matching trips.
8. /trips filters and searches without a page reload, and the Back button works.
9. npm run lint and npm test report no errors.