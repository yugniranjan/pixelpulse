import React, { memo } from "react";
import star from "@public/assets/images/home/star.png";
import Image from "next/image";

const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  for (let i = 0; i < fullStars; i++) {
    stars.push( <Image src={star} alt="star icon" width={18} height={18} key={`star-${i}`} unoptimized/>);
  }
  return stars;
};

const RatingComponent = memo(({ ratingdata }) => {

  return (
    <section>
        <h2 className="aero_rating_second_heading">Why Our Clients Choose Us Over and Over Again</h2>
        <p className="aero_rating_overallrating">Our Overall Rating : &nbsp; <strong></strong></p>
      <section className="aero_rating_wrapper">
        {ratingdata.reviews?.slice(0, 3).map((review, i) => {
          const stars = renderStars(review.rating); 
          return (
            <article key={i} className="aero_rating_card">
             <h4>Rating : &nbsp; {stars}</h4>
              <p>{review.text}  <span className="aero_rating_readmore">...Read More</span></p>
              <h5>{review.author_name}</h5>
             
            </article>
          );
        })}
      </section>
    </section>
  );
});

RatingComponent.displayName = "RatingComponent";

export default RatingComponent;
