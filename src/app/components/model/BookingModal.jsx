"use client";

import { LOCATION_NAME } from "@/lib/constant";
import { getConfigValue } from "@/lib/ctaContent";
import { fetchsheetdata } from "@/lib/sheets";
import Loading from "@/loading";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const BookingModal = ({ isOpen, onClose, bookingType }) => {
  const location_slug = LOCATION_NAME;
  const pathname = usePathname();

  const [dataconfig, setDataconfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalRoot, setModalRoot] = useState(null);
  const [selectedBookingMode, setSelectedBookingMode] = useState("ticket");
  const closeButtonRef = useRef(null);
  const headingId = "booking-modal-title";
  const descriptionId = "booking-modal-description";

  const initialPartyMode =
    bookingType === "party" ||
    (bookingType !== "ticket" && pathname === "/kids-birthday-parties");

  useEffect(() => {
    setModalRoot(document.getElementById("modal-root"));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedBookingMode(initialPartyMode ? "party" : "ticket");
    }
  }, [initialPartyMode, isOpen]);

  useEffect(() => {
    let ignore = false;

    const getData = async () => {
      try {
        setLoading(true);
        const data = await fetchsheetdata("config", location_slug);
        if (!ignore) {
          setDataconfig(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("booking modal config failed:", error);
        if (!ignore) {
          setDataconfig([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      getData();
    }

    return () => {
      ignore = true;
    };
  }, [isOpen, location_slug]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onClose]);

  const lilypadposParty = getConfigValue(dataconfig, ["lilypadpos_party"]);
  const lilypadposTicket = getConfigValue(dataconfig, ["lilypadpos_ticket"]);
  const birthdayPartyBookingUrl =
    getConfigValue(dataconfig, [
      "bookingModalBirthdayPartyUrl",
      "bookingModalPartyUrl",
      "birthdayPartyBookingUrl",
    ]) || "https://birthdays.pixelpulseplay.ca/";

  const isPartyPath = selectedBookingMode === "party";
  const iframeUrl = isPartyPath ? lilypadposParty : lilypadposTicket;

  if (!isOpen || !modalRoot) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className={`booking-overlay ${isOpen ? "booking-overlayShow" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`booking-sidebar ${isOpen ? "booking-sidebarOpen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-sidebarContent">
          <div className="booking-shell">
            <div className="booking-shell__topbar">
              <div className="booking-shell__eyebrow">Pixel Pulse Play</div>
              <button
                ref={closeButtonRef}
                type="button"
                className="booking-closeBtn"
                onClick={onClose}
                aria-label="Close booking"
              >
                ✕
              </button>
            </div>

            <div className="booking-shell__header">
              <h2 id={headingId}>{isPartyPath ? "Book A Party" : "Book Your Visit"}</h2>
              <div className="booking-shell__header-copy" id={descriptionId}>
                <p>
                  Reserve your spot in a few clicks. Pick a time, confirm your details,
                  and get ready for high-energy play.
                </p>
                {!isPartyPath && (birthdayPartyBookingUrl || lilypadposParty) && (
                  <p className="booking-shell__party-inline">
                    Click here to{" "}
                    {birthdayPartyBookingUrl ? (
                      <a
                        className="booking-shell__party-cta"
                        href={birthdayPartyBookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Book A Birthday Party
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="booking-shell__party-cta"
                        onClick={() => setSelectedBookingMode("party")}
                      >
                        Book A Birthday Party
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="booking-shell__meta">
              <span>Fast checkout</span>
              <span>Live availability</span>
              <span>{isPartyPath ? "Party booking" : "General admission"}</span>
            </div>

          {loading ? (
              <div className="booking-frame booking-frame--loading">
                <Loading />
              </div>
          ) : iframeUrl ? (
              <div className="booking-frame">
                <iframe
                  src={iframeUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="Booking"
                  style={{ minHeight: "78vh" }}
                />
              </div>
          ) : (
              <div className="booking-frame booking-frame--empty">
                <div className="booking-empty">
                  <p>Booking is temporarily unavailable. Please try again in a moment.</p>
                </div>
              </div>
          )}
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
};

export default BookingModal;
