"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import SectionHeading from "./home/SectionHeading";

const MotionImage = ({ pageData, waiverLink }) => {
  if (!pageData) return null;

  const item = Array.isArray(pageData) && pageData.length > 0 ? pageData[0] : pageData;
  if (!item) return null;

  const hasVideo = Boolean(item.video);

  return (
    <section className="aero_home-headerimg-wrapper">
      {hasVideo ? (
        <section className="aero_home_video-container">
          <video autoPlay muted loop playsInline width="100%">
            <source src={item.video} type="video/mp4" />
          </video>

          <article className="image-content">

            <SectionHeading mainHeading="true" className="section-heading-orange">
              Pixel Pulse <br /> <span> Play n Party</span>
            </SectionHeading>

            <p
              dangerouslySetInnerHTML={{ __html: item.smalltext || "" }}
            />

            {waiverLink && (
              <div className="aero-btn-booknow">
                <Link href={waiverLink} target="_blank">
                  <motion.button
                    animate={{
                      scale: [1, 1.2, 1.5, 1.2, 1],
                      borderRadius: ["12px", "30px", "60px", "30px", "12px"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    WAIVER
                  </motion.button>
                </Link>
              </div>
            )}
          </article>
        </section>
      ) : (
        <motion.div
          className="image-container"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          style={{ maxHeight: "600px", minHeight: "450px" }}
        >
          <Image
            src={
              item.headerimage ||
              "https://storage.googleapis.com/aerosports/aerosports-trampoline-park-redefine-fun.svg"
            }
            alt={item.imagetitle || "pixelpulseplay fun for everyone"}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />

          <motion.article
            className="image-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3 }}
          >
            <SectionHeading mainHeading="true" className="section-heading-orange">
              Pixel Pulse <br /> <span> Play n Party</span>
            </SectionHeading>

            <p
              dangerouslySetInnerHTML={{ __html: item.smalltext || "" }}
            />

            {waiverLink && (
              <div className="aero-btn-booknow">
                <Link href={waiverLink} target="_blank">
                  <motion.button
                    animate={{
                      scale: [1, 1.2, 1.5, 1.2, 1],
                      borderRadius: ["12px", "30px", "60px", "30px", "12px"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    WAIVER
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.article>
        </motion.div>
      )}
    </section>
  );
};

export default MotionImage;
