import React, { useState, useEffect } from 'react';
import { Modal, Button, Upload, List, Checkbox, Row, Col, Empty, App } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const ImageGalleryModal = ({ visible, allImages, selectedImages, onClose, onConfirm, onImageUpload }) => {
    const [internalSelected, setInternalSelected] = useState(selectedImages);
    const [fileList, setFileList] = useState([]);
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
    };

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

            // آدرس عکس از پاسخ جدید خوانده می‌شود و به والد ارسال می‌شود
            const imageUrl = response.data.data.imageUrl;
            onImageUpload(imageUrl); 

            // پاسخ را برای نمایش تامبنیل به antd ارسال می‌کنیم
            onSuccess(response.data, file);
            messageApi.success(`${file.name} با موفقیت آپلود شد.`);
        } catch (error) {
            console.error('Upload Error:', error);
            const errorMsg = error.response?.data?.message || 'خطا در آپلود فایل';
            messageApi.error(errorMsg);
            onError(error);
        }
    };

    const handleUploadChange = ({ file, fileList: newFileList }) => {
        // ایجاد یک لیست جدید برای جلوگیری از مشکلات state در React
        const updatedList = newFileList.map(f => {
            // وقتی آپلود موفقیت‌آمیز بود، پاسخ سرور در f.response قرار دارد
            if (f.response && f.response.data && f.response.data.imageUrl) {
                // آدرس تامبنیل را از پاسخی که بک‌اند داده است تنظیم می‌کنیم
                f.thumbUrl = f.response.data.imageUrl;
            }
            return f;
        });
        setFileList(updatedList);

        // پاک کردن فایل از لیست نمایش پس از چند ثانیه
        if (file.status === 'done' || file.status === 'error') {
             setTimeout(() => {
                 setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
            }, 2000);
        }
    };

    return (
        <Modal
            title="مدیریت گالری تصاویر"
            open={visible} // 'visible' به 'open' تغییر کرد برای نسخه‌های جدیدتر antd
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
                        fileList={fileList}
                        onChange={handleUploadChange}
                        listType="picture"
                        multiple
                        accept="image/png, image/jpeg, image/gif, image/webp"
                    >
                        <Button icon={<UploadOutlined />}>آپلود عکس جدید</Button>
                    </Upload>
                </Col>
            </Row>

            <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '10px' }}>
                {allImages && allImages.length > 0 ? (
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
                                    <img src={imgUrl} alt="gallery thumbnail" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
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
                    border-radius: 6px;
                    overflow: hidden;
                    transition: border-color 0.3s;
                }
                .gallery-item.selected {
                    border-color: #1677ff; /* رنگ جدید antd */
                }
                .gallery-item-overlay {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 50%;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .gallery-item:hover .gallery-item-overlay,
                .gallery-item.selected .gallery-item-overlay {
                    opacity: 1;
                }
            `}</style>
        </Modal>
    );
};

export default ImageGalleryModal;