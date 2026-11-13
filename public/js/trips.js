const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

let allTrips = [];

const fillSelect = (select, values) => {
    [...new Set(values)].sort().forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = capitalize(value);
        select.append(option);
    });
};

const renderTrips = (trips) => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');

    if (trips.length === 0) {
        listEl.textContent = 'No trips match your filters.';
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

const applyFilters = () => {
    const region = document.getElementById('trip-region-filter').value;
    const season = document.getElementById('trip-season-filter').value;

    const filtered = allTrips.filter(
        (trip) =>
            (region === 'all' || trip.region === region) &&
            (season === 'all' || trip.bestSeason === season)
    );

    renderTrips(filtered);
};

const loadTrips = async () => {
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        allTrips = await response.json();

        fillSelect(document.getElementById('trip-region-filter'), allTrips.map((trip) => trip.region));
        fillSelect(document.getElementById('trip-season-filter'), allTrips.map((trip) => trip.bestSeason));

        document.getElementById('trip-region-filter').addEventListener('change', applyFilters);
        document.getElementById('trip-season-filter').addEventListener('change', applyFilters);

        renderTrips(allTrips);
        loadingEl.hidden = true;
    } catch (error) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
    }
};

document.addEventListener('DOMContentLoaded', loadTrips);