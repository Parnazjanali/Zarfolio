import React, { useState, useEffect, useMemo } from 'react';
import './ImageSlider.css';
const ImageSlider = ({ images: uploadedImages, interval = 5000, randomOrder = false, transition = 'fade' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // از useMemo برای اعمال ترتیب تصادفی فقط یک بار (یا در صورت تغییر props) استفاده می‌کنیم
    const images = useMemo(() => {
        const imageList = uploadedImages && uploadedImages.length > 0 ? uploadedImages : []; // No default image

        if (randomOrder) {
            // Fisher-Yates shuffle algorithm
            const shuffled = [...imageList];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
            }
            return shuffled;
        }
        return imageList;
    }, [uploadedImages, randomOrder]);

    useEffect(() => {
        if (images.length <= 1) return; // اگر فقط یک عکس وجود دارد، تایمر را اجرا نکن

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    // اضافه کردن کلاس مربوط به ترنزیشن به کانتینر اصلی
    return (
        <div className={`image-slider-container transition-${transition}`}>
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