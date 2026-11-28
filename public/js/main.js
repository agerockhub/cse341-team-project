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
    const emptyEl = document.getElementById('trains-empty');

    // Search and filter controls
    const searchForm = document.getElementById('trains-search-form');
    const searchInput = document.getElementById('trains-search-input');
    const typeFilter = document.getElementById('trains-type-filter');
    const powerFilter = document.getElementById('trains-power-filter');
    const clearBtn = document.getElementById('trains-clear-btn');

    // Pagination controls
    const paginationEl = document.getElementById('trains-pagination');
    const prevBtn = document.getElementById('trains-prev');
    const nextBtn = document.getElementById('trains-next');
    const pageInfoEl = document.getElementById('trains-page-info');

    if (!listEl || !templateEl) {
        return;
    }

    // Read search/filter values from the URL.
    const syncControlsFromUrl = () => {
        const url = new URL(window.location.href);

        if (searchInput) {
            searchInput.value = url.searchParams.get('q') || '';
        }

        if (typeFilter) {
            typeFilter.value = url.searchParams.get('type') || '';
        }

        if (powerFilter) {
            powerFilter.value = url.searchParams.get('powerSource') || '';
        }
    };

    // Load trains from the API.
    const loadTrains = async () => {
        try {
            if (errorEl) {
                errorEl.hidden = true;
            }

            if (emptyEl) {
                emptyEl.hidden = true;
            }

            if (loadingEl) {
                loadingEl.hidden = false;
            }

            listEl.replaceChildren();

            const currentUrl = new URL(window.location.href);
            const apiUrl = new URL('/api/trains', window.location.origin);

            // Pagination parameters
            const page = currentUrl.searchParams.get('page') || '1';
            const limit = currentUrl.searchParams.get('limit') || '10';

            // Sorting parameters
            const sort = currentUrl.searchParams.get('sort') || 'name';
            const order = currentUrl.searchParams.get('order') || 'asc';

            // Search and filter parameters
            const q = currentUrl.searchParams.get('q');
            const type = currentUrl.searchParams.get('type');
            const powerSource = currentUrl.searchParams.get('powerSource');

            apiUrl.searchParams.set('page', page);
            apiUrl.searchParams.set('limit', limit);
            apiUrl.searchParams.set('sort', sort);
            apiUrl.searchParams.set('order', order);

            if (q) {
                apiUrl.searchParams.set('q', q);
            }

            if (type) {
                apiUrl.searchParams.set('type', type);
            }

            if (powerSource) {
                apiUrl.searchParams.set('powerSource', powerSource);
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.data || [];
            const pagination = payload.pagination;

            // Handle empty results.
            if (trains.length === 0) {
                if (emptyEl) {
                    emptyEl.hidden = false;
                }

                if (paginationEl) {
                    paginationEl.hidden = true;
                }

                if (loadingEl) {
                    loadingEl.hidden = true;
                }

                return;
            }

            // Create train cards.
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
                card.querySelector('[data-field="description"]').textContent =
                    train.description || '';
                card.querySelector('[data-field="best-for"]').textContent =
                    train.bestFor || '';

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);

            // Update pagination.
            if (pagination && paginationEl) {
                const currentPage = pagination.currentPage;
                const totalPages = pagination.totalPages;

                if (pageInfoEl) {
                    pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
                }

                if (prevBtn) {
                    prevBtn.disabled = !pagination.hasPreviousPage;
                }

                if (nextBtn) {
                    nextBtn.disabled = !pagination.hasNextPage;
                }

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

            if (emptyEl) {
                emptyEl.hidden = true;
            }

            if (paginationEl) {
                paginationEl.hidden = true;
            }
        }
    };

    // Apply search and filters.
    const applySearchAndFilters = () => {
        const url = new URL(window.location.href);

        const q = searchInput?.value.trim() || '';
        const type = typeFilter?.value || '';
        const powerSource = powerFilter?.value || '';

        // Update keyword.
        if (q) {
            url.searchParams.set('q', q);
        } else {
            url.searchParams.delete('q');
        }

        // Update train type.
        if (type) {
            url.searchParams.set('type', type);
        } else {
            url.searchParams.delete('type');
        }

        // Update power source.
        if (powerSource) {
            url.searchParams.set('powerSource', powerSource);
        } else {
            url.searchParams.delete('powerSource');
        }

        // Every new search/filter starts on page 1.
        url.searchParams.set('page', '1');

        // Preserve sorting and limit settings.
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

    // Search form submission.
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            applySearchAndFilters();
        });
    }

    // Automatically apply train type filter changes.
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            applySearchAndFilters();
        });
    }

    // Automatically apply power source filter changes.
    if (powerFilter) {
        powerFilter.addEventListener('change', () => {
            applySearchAndFilters();
        });
    }

    // Clear search and filters.
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
            }

            if (typeFilter) {
                typeFilter.value = '';
            }

            if (powerFilter) {
                powerFilter.value = '';
            }

            const url = new URL(window.location.href);

            url.searchParams.delete('q');
            url.searchParams.delete('type');
            url.searchParams.delete('powerSource');

            // Reset to first page.
            url.searchParams.set('page', '1');

            window.history.pushState({}, '', url);

            loadTrains();
        });
    }

    // Navigate to another page while preserving search and filters.
    const navigateToPage = (page) => {
        const url = new URL(window.location.href);

        url.searchParams.set('page', page);

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

    // Previous page.
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            const currentPage = Number(currentUrl.searchParams.get('page')) || 1;

            if (currentPage > 1) {
                navigateToPage(currentPage - 1);
            }
        });
    }

    // Next page.
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            const currentPage = Number(currentUrl.searchParams.get('page')) || 1;

            navigateToPage(currentPage + 1);
        });
    }

    // Support browser Back and Forward buttons.
    window.addEventListener('popstate', () => {
        syncControlsFromUrl();
        loadTrains();
    });

    // Initialize the search/filter controls from the URL.
    syncControlsFromUrl();

    // Load the initial train list.
    await loadTrains();
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
});
