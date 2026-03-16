"use client";
import { LOCATION_NAME } from "@/lib/constant";
import { fetchsheetdata } from "@/lib/sheets";
import Loading from "@/loading";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const BookingModal = ({ isOpen, onClose }) => {

    const location_slug = LOCATION_NAME;
    const pathname = usePathname();

    const [dataconfig, setDataconfig] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getData = async () => {
            const data = await fetchsheetdata("config", location_slug);
            // console.log("dataconfig", data);
            setDataconfig(data);
            setLoading(false);
        };

        getData();
    }, []);

    const lilypadposParty = dataconfig.find(item => item.key === "lilypadpos_party")?.value;
    const lilypadposTicket = dataconfig.find(item => item.key === "lilypadpos_ticket")?.value;
    console.log("dataconfig", lilypadposParty, lilypadposTicket);

    const iframeUrl = pathname === "/kids-birthday-parties"
        ? lilypadposParty
        : lilypadposTicket;


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

                {/* Loading */}
                {loading && (
                    <Loading/>
                )}

                <iframe
                    src={iframeUrl}
                    width="100%"
                    height="90%"
                    frameBorder="0"
                    style={{ paddingTop: "25px" }}
                >
                </iframe>
            </div>
        </>
    );
};

export default BookingModal;
