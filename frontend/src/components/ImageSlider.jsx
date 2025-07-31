import React, { useState, useEffect } from 'react';
import './ImageSlider.css';

// میتونی آدرس عکس‌های خودت رو اینجا قرار بدی
// برای مثال، من از یک تصویر موجود در پروژه استفاده می‌کنم
import defaultImage from '../assets/images/dashboard-backgrounds/nasirolmolk.webp';

const defaultImages = [
  defaultImage,
  // آدرس تصاویر بعدی رو اینجا اضافه کن
  // مثلا: '/path/to/your/image2.jpg',
];

const ImageSlider = ({ images = defaultImages, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (!images || images.length === 0) {
    return <div className="image-slider-container empty"></div>;
  }

  return (
    <div className="image-slider-container">
      {images.map((image, index) => (
        <div
          key={index}
          className={`slider-image ${index === currentIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
    </div>
  );
};

export default ImageSlider;