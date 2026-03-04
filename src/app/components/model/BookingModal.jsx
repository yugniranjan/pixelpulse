"use client";
import React from "react";

const BookingModal = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={`booking-overlay ${isOpen ? "booking-overlayShow" : ""}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={`booking-sidebar ${isOpen ? "booking-sidebarOpen" : ""}`}>
                <div className="d-flex-end aero-btn-booknow">
                     <button className="booking-closeBtn" onClick={onClose}>
                    ✕
                </button>
                </div>
               
                <iframe
                    src="https://square.site/appointments/buyer/widget/8l5i0sfoms83a9/LD5QMJPJD957Q"
                    width="100%"
                    height="90%"
                    frameBorder="0"  
                    style={{paddingTop:"25px"}}
                    >

                </iframe>
            </div>
        </>
    );
};

export default BookingModal;
