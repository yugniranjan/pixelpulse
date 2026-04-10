'use client';

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "../../styles/modal.css";
import { IoCloseSharp } from "react-icons/io5";

const Modal = ({ isOpen, onClose, children }) => {
  const [modalRoot, setModalRoot] = useState(null);

  useEffect(() => {
    setModalRoot(document.getElementById("modal-root"));
  }, []);

  if (!isOpen || !modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
      
        <button className="modal-close" onClick={onClose}>
          <IoCloseSharp />
        </button>
      
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;
