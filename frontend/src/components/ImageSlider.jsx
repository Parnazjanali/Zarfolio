import React, { useState, useEffect, useMemo } from 'react';
import './ImageSlider.css';

// یک تصویر پیش‌فرض در صورت نبودن عکس‌های آپلود شده
import defaultImage from '../assets/images/dashboard-backgrounds/nasirolmolk.webp';

const ImageSlider = ({ images: uploadedImages, interval = 5000, randomOrder = false, transition = 'fade' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // از useMemo برای اعمال ترتیب تصادفی فقط یک بار (یا در صورت تغییر props) استفاده می‌کنیم
    const images = useMemo(() => {
        const imageList = uploadedImages && uploadedImages.length > 0 ? uploadedImages : [defaultImage];
        
        if (randomOrder) {
            // الگوریتم Fisher-Yates برای به هم ریختن آرایه
            const shuffled = [...imageList];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
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

    if (!images || images.length === 0) {
        return <div className="image-slider-container empty"></div>;
    }

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