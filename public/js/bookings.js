const renderBookings = (bookings) => {
    const listEl = document.getElementById('bookings-list');
    const templateEl = document.getElementById('booking-card-template');

    if (bookings.length === 0) {
        listEl.textContent = 'No bookings yet.';
        return;
    }

    const fragment = document.createDocumentFragment();

    bookings.forEach((booking) => {
        const card = templateEl.content.cloneNode(true);
        const set = (field, value) => {
            card.querySelector(`[data-field="${field}"]`).textContent = value;
        };

        const lead = (booking.passengers || [])[0];

        set('reference', `Booking ${booking.id}`);
        set('trip', booking.tripId);
        set('ticket', booking.ticketClass);
        set('day', booking.selectedDay);
        set('count', (booking.passengers || []).length);
        set('lead', lead ? `${lead.firstName} ${lead.lastName} (${lead.email})` : 'None');
        set(
            'booked',
            new Date(booking.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        );

        card.querySelector('[data-field="link"]').href = `/trips/confirmation/${encodeURIComponent(booking.id)}`;

        fragment.append(card);
    });

    listEl.replaceChildren(fragment);
};

const loadBookings = async () => {
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');

    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const bookings = await response.json();
        renderBookings(bookings);
        loadingEl.hidden = true;
    } catch (error) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        errorEl.textContent = 'Unable to load bookings right now. Please try again in a moment.';
    }
};

document.addEventListener('DOMContentLoaded', loadBookings);