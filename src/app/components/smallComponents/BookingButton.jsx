'use client';

const BookingButton = ({ title = "", className = "", bookingType = "ticket" }) => {
    if (!title) {
        return null;
    }

    const bookingPath = `/booking?type=${encodeURIComponent(bookingType)}`;

    return (
        <button type="button" className={className} onClick={() => window.location.assign(bookingPath)}>
            {title}
        </button>
    )
}

export default BookingButton
