import React from 'react';
import { fetchFaqData } from "@/lib/sheets";
import { color } from 'framer-motion';

const FaqCard = async ({ location_slug, page }) => {
  const data = await fetchFaqData(location_slug, 'kids-birthday-parties');

  // If no FAQ data, don't render anything
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className='aero_home_article_section' >
    <section className="aero-max-container">
     
        <div className="subcategory_main_section entry-content">
  <h2>FAQS</h2>
    <div style={{color:'white'}}>Have questions? We’ve got answers! If you need more information, don’t hesitate to reach out to your local pixelpulseplay park for further support.</div>   
          {data.map((item, i) => {
            const { question, answer } = item;
            return (
              <div key={i}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </div>
            );
          })}
        </div>
     
    </section>
    </section>
  );
};

export default FaqCard;
