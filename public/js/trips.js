const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

let current = { page: 1, limit: DEFAULT_LIMIT, q: '', region: '', season: '' };

// A dropdown value from the address bar is only accepted if the dropdown really has that option.
const optionValue = (selectId, value) => {
    const select = document.getElementById(selectId);
    return value && [...select.options].some((option) => option.value === value) ? value : '';
};

// Accepts only plain whole numbers such as "2" (not "2abc" or "5.5").
const parseWholeNumber = (value) => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
};

const readParams = () => {
    const params = new URLSearchParams(window.location.search);
    const page = parseWholeNumber(params.get('page'));
    const limit = parseWholeNumber(params.get('limit'));

    return {
        page: page !== null && page >= 1 ? page : 1,
        limit: limit !== null && limit >= 1 && limit <= MAX_LIMIT ? limit : DEFAULT_LIMIT,
        q: (params.get('q') || '').trim().slice(0, MAX_SEARCH_LENGTH),
        region: optionValue('trip-region-filter', params.get('region')),
        season: optionValue('trip-season-filter', params.get('season'))
    };
};

const buildQueryString = ({ page, limit, q, region, season }) => {
    const params = new URLSearchParams({ page, limit });

    if (q) {
        params.set('q', q);
    }
    if (region) {
        params.set('region', region);
    }
    if (season) {
        params.set('season', season);
    }

    return params.toString();
};

const hasFilters = ({ q, region, season }) => Boolean(q || region || season);

// Puts the values from the address bar (or the last search) back into the form.
const syncControls = ({ q, region, season }) => {
    document.getElementById('trip-search').value = q;
    document.getElementById('trip-region-filter').value = region;
    document.getElementById('trip-season-filter').value = season;
};

const renderTrips = (trips, filtered) => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');

    if (trips.length === 0) {
        listEl.textContent = filtered ? 'No trips match your filters.' : 'No trips on this page.';
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
const loadTrips = async (state, historyMode = false) => {
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    loadingEl.hidden = false;
    errorEl.hidden = true;

    try {
        const response = await fetch(`/api/trips?${buildQueryString(state)}`);
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const { data, pagination } = await response.json();

        // A page past the end (for example ?page=99) falls back to the last page, or to page 1 when nothing matches.
        if (state.page > 1 && (pagination.totalPages === 0 || state.page > pagination.totalPages)) {
            await loadTrips({ ...state, page: Math.max(pagination.totalPages, 1) }, 'replace');
            return;
        }

        current = state;
        syncControls(state);
        renderTrips(data, hasFilters(state));
        updateControls(pagination);

        const url = `/trips?${buildQueryString(state)}`;
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

// A new search or filter always starts again at page 1.
const applyFilters = () => {
    loadTrips({
        page: 1,
        limit: current.limit,
        q: document.getElementById('trip-search').value.trim().slice(0, MAX_SEARCH_LENGTH),
        region: document.getElementById('trip-region-filter').value,
        season: document.getElementById('trip-season-filter').value
    }, 'push');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('filters').addEventListener('submit', (event) => {
        event.preventDefault();
        applyFilters();
    });

    document.getElementById('trip-region-filter').addEventListener('change', applyFilters);
    document.getElementById('trip-season-filter').addEventListener('change', applyFilters);

    document.getElementById('trip-clear').addEventListener('click', () => {
        document.getElementById('trip-search').value = '';
        document.getElementById('trip-region-filter').value = '';
        document.getElementById('trip-season-filter').value = '';
        applyFilters();
    });

    document.getElementById('trips-prev').addEventListener('click', () => {
        loadTrips({ ...current, page: current.page - 1 }, 'push');
    });

    document.getElementById('trips-next').addEventListener('click', () => {
        loadTrips({ ...current, page: current.page + 1 }, 'push');
    });

    // The browser's back and forward buttons reload the matching page and filters.
    window.addEventListener('popstate', () => loadTrips(readParams()));

    loadTrips(readParams());
});