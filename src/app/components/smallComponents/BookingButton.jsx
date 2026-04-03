'use client';

import React, { useState } from 'react'
import BookingModal from '../model/BookingModal';

const BookingButton = ({ title = "Book Now", className = "", bookingType }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <>
            <button className={className} onClick={() => setIsSidebarOpen(true)}>{title}</button>
            {
                isSidebarOpen && (
                  <BookingModal
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    bookingType={bookingType}
                  />
                )
              }

        </>
    )
}

export default BookingButton
