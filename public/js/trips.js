const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

let current = { page: 1, limit: DEFAULT_LIMIT };

// Reads ?page= and ?limit= from the address bar, falling back to safe defaults.
const readPageParams = () => {
    const params = new URLSearchParams(window.location.search);
    const page = Number.parseInt(params.get('page'), 10);
    const limit = Number.parseInt(params.get('limit'), 10);

    return {
        page: Number.isInteger(page) && page >= 1 ? page : 1,
        limit: Number.isInteger(limit) && limit >= 1 && limit <= MAX_LIMIT ? limit : DEFAULT_LIMIT
    };
};

const renderTrips = (trips) => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');

    if (trips.length === 0) {
        listEl.textContent = 'No trips on this page.';
        return;
    }

    const fragment = document.createDocumentFragment();

    trips.forEach((trip) => {
        const card = templateEl.content.cloneNode(true);
        const set = (field, value) => {
            card.querySelector(`[data-field="${field}"]`).textContent = value;
        };

        card.querySelector('.route-card').classList.add(trip.region);

        set('name', trip.name);
        set('region', trip.region);
        set('start', trip.startStation);
        set('end', trip.endStation);
        set('duration', trip.duration);
        set('distance', `${trip.distance} km`);
        set('description', trip.description);

        const seasonEl = card.querySelector('[data-field="season"]');
        seasonEl.textContent = `Best in ${trip.bestSeason}`;
        seasonEl.classList.add(`season-${trip.bestSeason}`);

        const highlightsEl = card.querySelector('[data-field="highlights"]');
        (trip.highlights || []).forEach((highlight) => {
            const tag = document.createElement('span');
            tag.className = 'highlight-tag';
            tag.textContent = highlight;
            highlightsEl.append(tag);
        });

        card.querySelector('[data-field="link"]').href = `/trips/${encodeURIComponent(trip.id)}`;

        fragment.append(card);
    });

    listEl.replaceChildren(fragment);
};

const updateControls = (pagination) => {
    const totalPages = Math.max(pagination.totalPages, 1);

    document.getElementById('trips-pagination').hidden = false;
    document.getElementById('trips-page-info').textContent =
        `Page ${pagination.page} of ${totalPages} (${pagination.totalItems} trips)`;
    document.getElementById('trips-prev').disabled = !pagination.hasPreviousPage;
    document.getElementById('trips-next').disabled = !pagination.hasNextPage;
};

// historyMode: 'push' adds a browser history entry, 'replace' rewrites the current one, false leaves the address alone.
const loadTrips = async ({ page, limit }, historyMode = false) => {
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    loadingEl.hidden = false;
    errorEl.hidden = true;

    try {
        const response = await fetch(`/api/trips?page=${page}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const { data, pagination } = await response.json();

        // A page past the end (for example ?page=99) falls back to the last page.
        if (pagination.totalPages > 0 && page > pagination.totalPages) {
            await loadTrips({ page: pagination.totalPages, limit }, 'replace');
            return;
        }

        current = { page, limit };
        renderTrips(data);
        updateControls(pagination);

        const url = `/trips?page=${page}&limit=${limit}`;
        if (historyMode === 'push') {
            window.history.pushState(null, '', url);
        } else if (historyMode === 'replace') {
            window.history.replaceState(null, '', url);
        }
    } catch (error) {
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
    } finally {
        loadingEl.hidden = true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('trips-prev').addEventListener('click', () => {
        loadTrips({ page: current.page - 1, limit: current.limit }, 'push');
    });

    document.getElementById('trips-next').addEventListener('click', () => {
        loadTrips({ page: current.page + 1, limit: current.limit }, 'push');
    });

    // The browser's back and forward buttons reload the matching page.
    window.addEventListener('popstate', () => loadTrips(readPageParams()));

    loadTrips(readPageParams());
});