document.addEventListener('DOMContentLoaded', () => {
    const tripElement = document.querySelector('.route-detail');
    const monthSelect = document.getElementById('schedule-month');
    const schedulesList = document.getElementById('schedules-list');
    const loadingMessage = document.getElementById('schedules-loading');
    const messageElement = document.getElementById('schedules-message');

    if (!tripElement || !monthSelect || !schedulesList) {
        return;
    }

    const tripId = tripElement.dataset.tripId;

    const showMessage = (message) => {
        messageElement.textContent = message;
        messageElement.hidden = false;
    };

    const loadSchedules = async () => {
        const selectedMonth = monthSelect.value;

        loadingMessage.hidden = false;
        messageElement.hidden = true;
        schedulesList.replaceChildren();

        try {
            let apiUrl = `/api/trips/${encodeURIComponent(tripId)}/schedules`;

            if (selectedMonth) {
                apiUrl += `?month=${encodeURIComponent(selectedMonth)}`;
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Unable to load schedules (${response.status})`);
            }

            const schedules = await response.json();

            loadingMessage.hidden = true;

            if (!Array.isArray(schedules) || schedules.length === 0) {
                showMessage('No schedules are available for the selected month.');
                return;
            }

            const fragment = document.createDocumentFragment();

            schedules.forEach((schedule) => {
                const card = document.createElement('div');
                card.className = 'schedule-card';

                const times = document.createElement('div');
                times.className = 'schedule-times';

                const departure = document.createElement('div');
                departure.className = 'time-block';

                const departureLabel = document.createElement('span');
                departureLabel.className = 'time-label';
                departureLabel.textContent = 'Departs';

                const departureTime = document.createElement('span');
                departureTime.className = 'time-value';
                departureTime.textContent = schedule.departureTime;

                departure.append(departureLabel, departureTime);

                const arrow = document.createElement('span');
                arrow.className = 'time-arrow';
                arrow.textContent = '\u2192';

                const arrival = document.createElement('div');
                arrival.className = 'time-block';

                const arrivalLabel = document.createElement('span');
                arrivalLabel.className = 'time-label';
                arrivalLabel.textContent = 'Arrives';

                const arrivalTime = document.createElement('span');
                arrivalTime.className = 'time-value';
                arrivalTime.textContent = schedule.arrivalTime;

                arrival.append(arrivalLabel, arrivalTime);

                times.append(departure, arrow, arrival);

                const days = document.createElement('div');
                days.className = 'schedule-days';

                (schedule.daysOfWeek || []).forEach((day) => {
                    const badge = document.createElement('span');
                    badge.className = 'day-badge';
                    badge.textContent = day.substring(0, 3);
                    days.append(badge);
                });

                const bookingLink = document.createElement('a');
                bookingLink.className = 'book-btn';
                bookingLink.href = `/trips/booking/${encodeURIComponent(schedule.id)}`;
                bookingLink.textContent = 'Book Now';

                card.append(times, days, bookingLink);
                fragment.append(card);
            });

            schedulesList.replaceChildren(fragment);

        } catch (error) {
            console.error('Error loading schedules:', error);

            loadingMessage.hidden = true;
            showMessage('Unable to load schedules right now. Please try again.');
        }
    };

    monthSelect.addEventListener('change', loadSchedules);

    // Load all schedules when the page first opens.
    loadSchedules();
});
