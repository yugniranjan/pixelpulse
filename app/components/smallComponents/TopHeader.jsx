"use client";
import React, { useEffect, useState } from "react";
import { IoCloseCircleSharp } from "react-icons/io5";
import "../../styles/modal.css";

const TopHeader = ({topheader}) => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleDOMContentLoaded = () => {
      openModal();
    };
    window.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
    return () => {
      window.removeEventListener("DOMContentLoaded", handleDOMContentLoaded);
    };
  }, []);
  return (
    isModalOpen && (
      <>
        <div className="aero_topheader_wrapper">
          <button className="modal-close" onClick={closeModal}>
            <IoCloseCircleSharp />
          </button>
         <div dangerouslySetInnerHTML={{__html: topheader[0]?.value || ''}}></div>
        </div>
      </>
    )
  );
};

export default TopHeader;
