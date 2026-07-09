'use client';

const BookingButton = ({ title = "", className = "", bookingType }) => {
    if (!title) {
        return null;
    }

    const bookingPath = bookingType
        ? `/booking?type=${encodeURIComponent(bookingType)}`
        : "/booking";

    return (
        <button type="button" className={className} onClick={() => window.location.assign(bookingPath)}>
            {title}
        </button>
    )
}

export default BookingButton
