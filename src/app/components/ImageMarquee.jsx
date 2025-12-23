import PropTypes from 'prop-types';
import styles from '../styles/ImageMarquee.module.css';

const DEFAULT_IMAGE = '/images/default-marquee.jpg'; // 🔁 Replace with your actual default image path

const ImageMarquee = ({ imagesString }) => {
  let images = [];

if (imagesString) {
  const imageItems = imagesString.includes(';')
    ? imagesString.split(';')
    : [imagesString]; // Handle single image too

  images = imageItems.map((item) => {
    const [src, title] = item.split('|');
    return { src: src?.trim(), title: title?.trim() || '' };
  });
  if(!images) return;
}

// console.log(images);
// console.log('header image');
  const isDefault = images.length === 0;

  return (
    <div className={styles.marquee}>
      <div className={styles.marqueeContent}>
        {isDefault ? (
          <div className={styles.imageContainer}>
            <img 
              src={DEFAULT_IMAGE}
              alt="pixelpulseplay Fun"
              title="pixelpulseplay Trampoline Park"
              width={400}
              height={267}
              loading='lazy'
            />
            <p className={styles.title}>pixelpulseplay Trampoline Fun</p>
          </div>
        ) : (
          images.map((image, index) => (
            <div key={index} className={styles.imageContainer}>
              <img 
                src={image.src}
                alt={image.title}
                title={image.title}
                width={400}
                height={267}
                loading='lazy'
              />
              {image.title && <p className={styles.title}>{image.title}</p>}
            </div>
          ))
        )}
      </div>

      {!isDefault && (
        <div className={styles.marqueeContentDuplicated}>
          {images.map((image, index) => (
            <div key={`${index}-duplicate`} className={styles.imageContainer}>
              <img 
                src={image.src}
                alt={image.title}
                title={image.title}
                width={400}
                height={267}
                loading='lazy'
              />
              {image.title && <p className={styles.title}>{image.title}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ImageMarquee.propTypes = {
  imagesString: PropTypes.string,
};

export default ImageMarquee;
