'use client';

import React, { useState } from 'react'
import BookingModal from '../model/BookingModal';

const BookingButton = ({ title = "Book Now" }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsSidebarOpen(true)}>{title}</button>
            {
                isSidebarOpen && <BookingModal isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            }

        </>
    )
}

export default BookingButton