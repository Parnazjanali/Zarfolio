import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Upload, Button, App } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import './ImageGalleryModal.css';

const { TabPane } = Tabs;
const { Dragger } = Upload;

const ImageGalleryModal = ({ visible, allImages = [], selectedImages = [], onClose, onConfirm, onImageUpload }) => {
    const { message } = App.useApp();
    const [activeKey, setActiveKey] = useState('1');
    const [localSelected, setLocalSelected] = useState(selectedImages);

    // وقتی مدال باز یا لیست عکس‌های انتخابی اصلی تغییر می‌کند، لیست محلی را به‌روز کن
    useEffect(() => {
        if (visible) {
            setLocalSelected(selectedImages);
        }
    }, [visible, selectedImages]);

    const handleImageClick = (imageUrl) => {
        setLocalSelected(prevSelected => {
            if (prevSelected.includes(imageUrl)) {
                // اگر عکس از قبل انتخاب شده، آن را حذف کن
                return prevSelected.filter(url => url !== imageUrl);
            } else {
                // در غیر این صورت، آن را اضافه کن
                return [...prevSelected, imageUrl];
            }
        });
    };

    const handleConfirm = () => {
        onConfirm(localSelected);
        onClose();
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        action: 'http://localhost:8080/api/v1/upload-image', // آدرس بک‌اند برای آپلود
        accept: ".png,.jpg,.jpeg",
        onChange(info) {
            const { status, response, name } = info.file;
            if (status === 'done') {
                message.success(`${name} با موفقیت آپلود شد.`);
                // پس از آپلود موفق، عکس جدید را به لیست کلی اضافه می‌کنیم
                // و به تب گالری برمی‌گردیم
                if (response && response.filePath) {
                    onImageUpload(response.filePath);
                    setActiveKey('1'); // بازگشت به تب گالری
                }
            } else if (status === 'error') {
                message.error(`${name} آپلود نشد.`);
            }
        },
    };

    return (
        <Modal
            title="کتابخانه و مدیریت تصاویر"
            open={visible} // <<<--- تغییر در این خط: visible به open تغییر کرد
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="back" onClick={onClose}>
                    انصراف
                </Button>,
                <Button key="submit" type="primary" onClick={handleConfirm}>
                    تایید و ذخیره عکس‌ها
                </Button>,
            ]}
        >
            <Tabs activeKey={activeKey} onChange={setActiveKey}>
                <TabPane tab="کتابخانه عکس‌ها" key="1">
                    <div className="image-gallery-grid">
                        {allImages.length > 0 ? (
                            allImages.map((imgUrl, index) => (
                                <div
                                    key={index}
                                    className={`gallery-item ${localSelected.includes(imgUrl) ? 'selected' : ''}`}
                                    onClick={() => handleImageClick(imgUrl)}
                                >
                                    <img src={imgUrl} alt={`gallery-${index}`} />
                                    <div className="checkmark-overlay">
                                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>هنوز عکسی آپلود نشده است. از تب "آپلود فایل جدید" شروع کنید.</p>
                        )}
                    </div>
                </TabPane>
                <TabPane tab="آپلود فایل جدید" key="2">
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">برای آپلود کلیک کنید یا عکس‌ها را به این قسمت بکشید</p>
                        <p className="ant-upload-hint">
                            پشتیبانی از آپلود تکی یا چندتایی. فقط فایل‌های JPG و PNG مجاز هستند.
                        </p>
                    </Dragger>
                </TabPane>
            </Tabs>
        </Modal>
    );
};

export default ImageGalleryModal;