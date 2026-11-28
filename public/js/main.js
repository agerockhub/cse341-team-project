const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');

    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');

    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    const paginationEl = document.getElementById('trains-pagination');
    const prevBtn = document.getElementById('trains-prev');
    const nextBtn = document.getElementById('trains-next');
    const pageInfoEl = document.getElementById('trains-page-info');

    if (!listEl || !templateEl) {
        return;
    }

    const loadTrains = async () => {
        try {
            if (errorEl) {
                errorEl.hidden = true;
            }

            if (loadingEl) {
                loadingEl.hidden = false;
            }

            const currentUrl = new URL(window.location.href);
            const apiUrl = new URL('/api/trains', window.location.origin);

            const page = currentUrl.searchParams.get('page') || '1';
            const limit = currentUrl.searchParams.get('limit') || '10';
            const sort = currentUrl.searchParams.get('sort') || 'name';
            const order = currentUrl.searchParams.get('order') || 'asc';

            apiUrl.searchParams.set('page', page);
            apiUrl.searchParams.set('limit', limit);
            apiUrl.searchParams.set('sort', sort);
            apiUrl.searchParams.set('order', order);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.data || [];
            const pagination = payload.pagination;

            const fragment = document.createDocumentFragment();

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);
                const imageEl = card.querySelector('[data-field="image"]');

                imageEl.src = train.imageUrl;
                imageEl.alt = train.imageAlt || `${train.name} train`;

                card.querySelector('[data-field="name"]').textContent = train.name;
                card.querySelector('[data-field="operator"]').textContent = train.operator;
                card.querySelector('[data-field="type"]').textContent = train.type;
                card.querySelector('[data-field="speed"]').textContent =
                    `${train.maxSpeedKmh} km/h`;
                card.querySelector('[data-field="seats"]').textContent =
                    `${train.capacity} seats`;
                card.querySelector('[data-field="power"]').textContent = train.powerSource;
                card.querySelector('[data-field="description"]').textContent = train.description;
                card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);

            // Update pagination information.
            if (pagination && paginationEl) {
                const currentPage = pagination.currentPage;
                const totalPages = pagination.totalPages;

                pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;

                prevBtn.disabled = !pagination.hasPreviousPage;
                nextBtn.disabled = !pagination.hasNextPage;

                // Show pagination only when there is more than one page.
                paginationEl.hidden = totalPages <= 1;
            }

            if (loadingEl) {
                loadingEl.hidden = true;
            }
        } catch (error) {
            console.error('Error loading trains:', error);

            if (loadingEl) {
                loadingEl.hidden = true;
            }

            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent =
                    'Unable to load trains right now. Please try again in a moment.';
            }

            if (paginationEl) {
                paginationEl.hidden = true;
            }
        }
    };

    // Navigate to a different page while preserving other query parameters.
    const navigateToPage = (page) => {
        const url = new URL(window.location.href);

        url.searchParams.set('page', page);

        // Preserve pagination and sorting settings.
        if (!url.searchParams.has('limit')) {
            url.searchParams.set('limit', '10');
        }

        if (!url.searchParams.has('sort')) {
            url.searchParams.set('sort', 'name');
        }

        if (!url.searchParams.has('order')) {
            url.searchParams.set('order', 'asc');
        }

        window.history.pushState({}, '', url);

        loadTrains();
    };

    // Previous page button.
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            const currentPage = Number(currentUrl.searchParams.get('page')) || 1;

            if (currentPage > 1) {
                navigateToPage(currentPage - 1);
            }
        });
    }

    // Next page button.
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            const currentPage = Number(currentUrl.searchParams.get('page')) || 1;

            navigateToPage(currentPage + 1);
        });
    }

    // Support browser Back and Forward buttons.
    window.addEventListener('popstate', () => {
        loadTrains();
    });

    // Load the initial page.
    await loadTrains();
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
});
