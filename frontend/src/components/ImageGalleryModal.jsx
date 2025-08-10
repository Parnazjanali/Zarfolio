import React, { useState, useEffect } from 'react';
import { Modal, Button, Upload, message, List, Checkbox, Row, Col, Empty, App } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const ImageGalleryModal = ({ visible, allImages, selectedImages, onClose, onConfirm, onImageUpload }) => {
    const [internalSelected, setInternalSelected] = useState(selectedImages);
    const [fileList, setFileList] = useState([]); // --- State جدید برای مدیریت فایل‌های در حال آپلود
    const { message: messageApi } = App.useApp();


    useEffect(() => {
        if (visible) {
            setInternalSelected(selectedImages);
        }
    }, [visible, selectedImages]);

    const handleSelectImage = (imgUrl) => {
        setInternalSelected(prev =>
            prev.includes(imgUrl) ? prev.filter(url => url !== imgUrl) : [...prev, imgUrl]
        );
    };

    const handleConfirm = () => {
        onConfirm(internalSelected);
        onClose();
    };

    const handleRemoveAll = () => {
        setInternalSelected([]);
    }

    const customRequest = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('image', file);
        const token = localStorage.getItem('authToken');

        try {
            const response = await axios.post('/api/v1/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            // پاسخ سرور باید حاوی آدرس عکس باشد
            const imageUrl = response.data.data.imageUrl;
            onImageUpload(imageUrl); // اطلاع‌رسانی به والد برای افزودن به لیست کلی
            onSuccess(response.data, file); //  اطلاع‌رسانی به کامپوننت آپلود که موفقیت‌آمیز بود
            messageApi.success(`${file.name} با موفقیت آپلود شد.`);
        } catch (error) {
            console.error('Upload Error:', error);
            const errorMsg = error.response?.data?.message || 'خطا در آپلود فایل';
            messageApi.error(errorMsg);
            onError(error);
        }
    };

    // --- تابع مدیریت تغییرات در لیست آپلود ---
    const handleUploadChange = ({ file, fileList: newFileList }) => {
        // فقط فایل‌هایی با وضعیت 'done' یا 'uploading' را نمایش بده
        const filteredList = newFileList.map(f => {
            if (f.response) {
                // اگر آپلود تمام شده، URL را از پاسخ سرور بگیر
                f.url = f.response.data.imageUrl;
                f.thumbUrl = f.response.data.imageUrl; // مهم برای نمایش تامبنیل
            }
            return f;
        });
        setFileList(filteredList);

        // اگر فایل با موفقیت آپلود شده و وضعیت 'done' است، لیست را خالی کن تا برای آپلود بعدی آماده باشد
        if (file.status === 'done') {
            setTimeout(() => {
                 setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
            }, 1500); // پس از ۱.۵ ثانیه فایل را از لیست حذف کن
        } else if (file.status === 'error') {
            // در صورت خطا نیز فایل را پس از مدتی از لیست حذف کن
             setTimeout(() => {
                 setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
            }, 2000);
        }
    };


    return (
        <Modal
            title="مدیریت گالری تصاویر"
            visible={visible}
            onCancel={onClose}
            onOk={handleConfirm}
            okText="تایید و ذخیره"
            cancelText="انصراف"
            width={800}
            destroyOnClose
        >
            <Row gutter={16}>
                <Col span={24}>
                    <Upload
                        customRequest={customRequest}
                        fileList={fileList} // --- استفاده از state داخلی
                        onChange={handleUploadChange} // --- استفاده از handler جدید
                        listType="picture"
                        multiple
                        accept="image/png, image/jpeg, image/gif, image/webp"
                    >
                        <Button icon={<UploadOutlined />}>آپلود عکس جدید</Button>
                    </Upload>
                </Col>
            </Row>

            <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px' }}>
                {allImages.length > 0 ? (
                     <List
                        header={<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>عکس‌های موجود ({allImages.length} عدد)</span>
                            <Button type="link" danger onClick={handleRemoveAll}>لغو انتخاب همه</Button>
                        </div>}
                        grid={{ gutter: 16, xs: 2, sm: 3, md: 4, lg: 5 }}
                        dataSource={allImages}
                        renderItem={imgUrl => (
                            <List.Item>
                                <div
                                    className={`gallery-item ${internalSelected.includes(imgUrl) ? 'selected' : ''}`}
                                    onClick={() => handleSelectImage(imgUrl)}
                                >
                                    <img src={imgUrl} alt="gallery thumbnail" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                    <div className="gallery-item-overlay">
                                        <Checkbox checked={internalSelected.includes(imgUrl)} />
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="هنوز عکسی آپلود نشده است." />
                )}
            </div>
             <style jsx>{`
                .gallery-item {
                    position: relative;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: border-color 0.3s;
                }
                .gallery-item.selected {
                    border-color: #1890ff;
                }
                .gallery-item-overlay {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </Modal>
    );
};

export default ImageGalleryModal;