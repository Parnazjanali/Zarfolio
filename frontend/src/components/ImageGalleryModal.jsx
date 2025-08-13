import React, { useState, useEffect } from 'react';
import { Modal, Button, Upload, List, Checkbox, Row, Col, Empty, App, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const ImageGalleryModal = ({ open, allImages, selectedImages, onClose, onConfirm, onImageUpload, onImageDelete }) => {
    const [internalSelected, setInternalSelected] = useState(selectedImages);
    const [fileList, setFileList] = useState([]);
    const { message: messageApi } = App.useApp();

    useEffect(() => {
        if (open) {
            setInternalSelected(selectedImages);
        }
    }, [open, selectedImages]);

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
            const response = await axios.post('/api/v1/slider/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            const imageUrl = response.data.url;
            onImageUpload(imageUrl);
            onSuccess(response.data, file);
            messageApi.success(`${file.name} با موفقیت آپلود شد.`);
        } catch (error) {
            console.error('Upload Error:', error);
            const errorMsg = error.response?.data?.error || 'خطا در آپلود فایل';
            messageApi.error(errorMsg);
            onError(error);
        }
    };

    const handleUploadChange = ({ file, fileList: newFileList }) => {
        const filteredList = newFileList.map(f => {
            if (f.response) {
                f.url = f.response.url;
                f.thumbUrl = f.response.url;
            }
            return f;
        });
        setFileList(filteredList);

        if (file.status === 'done') {
            setTimeout(() => {
                 setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
            }, 1500);
        } else if (file.status === 'error') {
             setTimeout(() => {
                 setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
            }, 2000);
        }
    };

    return (
        <Modal
            title="مدیریت گالری تصاویر"
            open={open}
            onCancel={onClose}
            onOk={handleConfirm}
            okText="تایید و ذخیره"
            cancelText="انصراف"
            width={800}
            destroyOnHidden
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
                                <div className="gallery-item-container">
                                    <div
                                        className={`gallery-item ${internalSelected.includes(imgUrl) ? 'selected' : ''}`}
                                        onClick={() => handleSelectImage(imgUrl)}
                                    >
                                        <img src={imgUrl} alt="gallery thumbnail" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                        <div className="gallery-item-overlay">
                                            <Checkbox checked={internalSelected.includes(imgUrl)} />
                                        </div>
                                    </div>
                                    <Popconfirm
                                        title="حذف تصویر"
                                        description="آیا از حذف این تصویر مطمئن هستید؟ این عمل قابل بازگشت نیست."
                                        onConfirm={() => onImageDelete(imgUrl)}
                                        okText="بله، حذف کن"
                                        cancelText="خیر"
                                    >
                                        <Button
                                            className="delete-btn"
                                            type="primary"
                                            danger
                                            shape="circle"
                                            icon={<DeleteOutlined />}
                                            size="small"
                                        />
                                    </Popconfirm>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="هنوز عکسی آپلود نشده است." />
                )}
            </div>
             <style>{`
                .gallery-item-container {
                    position: relative;
                }
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
                .delete-btn {
                    position: absolute;
                    bottom: 5px;
                    left: 5px;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }
                .gallery-item-container:hover .delete-btn {
                    opacity: 1;
                }
            `}</style>
        </Modal>
    );
};

export default ImageGalleryModal;
