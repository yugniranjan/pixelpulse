import React from 'react'
import '../../styles/contactus.css'
import ContactForm from '@/components/smallComponents/ContactForm';

const page = () => {
  return (
    <div>
      <h1 className='aero_contact-mainheading'>Contact Us</h1>
       <ContactForm/>
    </div>
  );
}

export default page