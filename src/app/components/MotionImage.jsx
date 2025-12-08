"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
const MotionImage = async ({ pageData, waiverLink }) => {
  //console.log(header_image);
  const item =
    Array.isArray(pageData) && pageData.length > 0 ? pageData[0] : pageData;
  // Handle case when no item exists
  if (!item) return null;

  const hasVideo = !!item.video;

  return (
    <section className="aero_home-headerimg-wrapper">
      {hasVideo ? (
        <section className="aero_home_video-container">
          <video autoPlay muted loop width="100%">
            <source src={item.video} type="video/mp4" />
          </video>
          <article className="image-content">
            {waiverLink && (
              <div className="aero-btn-booknow">
                <Link href={waiverLink} target="_blank">
                  <motion.button
                    animate={{
                      scale: [1, 1.2, 1.5, 1.2, 1],
                      borderRadius: ["12px", "30px", "60px", "30px", "12px"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                    }}
                  >
                    WAIVER
                  </motion.button>
                </Link>
              </div>
            )}
          </article>
          <h1 className="aero-home-h1heading">{item.title}</h1>
          {/* <h1>{item.title}</h1> */}
          <p style={{color:"#fff" , padding:"20px 10px 20px 10px" , textAlign:"center"}} dangerouslySetInnerHTML={{ __html: item.smalltext }} />
        </section>
      ) : (
        <motion.div
          className="image-container"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ maxHeight: "600px", minHeight: "450px" }}
        >
          <Image
            src={
              item.headerimage ||
              "https://storage.googleapis.com/aerosports/aerosports-trampoline-park-redefine-fun.svg"
            } // Ensure `item.image` has valid URL
            alt={item.imagetitle || "Aerosports fun for everyone"}
            layout="fill"
            objectFit="cover"
            quality={85}
            priority
          />

          <motion.article
            className="image-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 3,
            }}
          >
            <h1>{item.title}</h1>
            <p dangerouslySetInnerHTML={{ __html: item.smalltext }} />
            {waiverLink && (
              <div className="aero-btn-booknow">
                <Link
                  href={waiverLink}
                  target="_blank"
                  title="sign your waiver at aerosports trampoline park"
                >
                  <motion.button
                    animate={{
                      scale: [1, 1.2, 1.5, 1.2, 1],
                      borderRadius: ["12px", "30px", "60px", "30px", "12px"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                    }}
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
