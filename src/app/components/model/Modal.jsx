'use client';

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/modal.css";
import { IoCloseSharp } from "react-icons/io5";

const Modal = ({
  isOpen,
  onClose,
  children,
  titleId,
  ariaLabel = "Dialog",
  contentStyle,
}) => {
  const [modalRoot, setModalRoot] = useState(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    setModalRoot(document.getElementById("modal-root"));
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousActiveElement = document.activeElement;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={titleId ? undefined : ariaLabel}
        onClick={(event) => event.stopPropagation()}
        style={contentStyle}
      >
      
        <button
          ref={closeButtonRef}
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <IoCloseSharp />
        </button>
      
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
