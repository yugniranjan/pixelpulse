'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const BookingButton = ({ title = "", className = "", bookingType = "ticket" }) => {
    const router = useRouter();
    const bookingPath = `/booking?type=${encodeURIComponent(bookingType)}`;

    useEffect(() => {
        if (!title) return;
        router.prefetch(bookingPath);
    }, [bookingPath, router, title]);

    if (!title) {
        return null;
    }

    return (
        <button type="button" className={className} onClick={() => router.push(bookingPath)}>
            {title}
        </button>
    )
}

export default BookingButton
