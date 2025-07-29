import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Upload, Button, message, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

// This should be configured globally
const API_URL = 'https://your-api-url.com';

const AvatarSettings = () => {
    const [avatarUrl, setAvatarUrl] = useState('');
    const [sealUrl, setSealUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch existing avatar and seal
        axios.post('/api/avatar/get').then(res => setAvatarUrl(`${API_URL}/api/avatar/get/file/${res.data}?t=${new Date().getTime()}`));
        axios.post('/api/seal/get').then(res => setSealUrl(`${API_URL}/api/seal/get/file/${res.data}?t=${new Date().getTime()}`));
    }, []);

    const handleUpload = async (options, type) => {
        const { file } = options;
        setLoading(true);
        const formData = new FormData();
        formData.append('bytes', file);
        
        const url = type === 'avatar' ? '/api/avatar/post' : '/api/seal/post';

        try {
            const response = await axios.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Handle specific error messages from your backend
            if (response.data === 'e') {
                message.error('فرمت فایل اشتباه است.');
            } else if (response.data === 's') {
                 message.error('حجم فایل باید کمتر از ۱ مگابایت باشد.');
            } else {
                 message.success(`فایل با موفقیت آپلود شد.`);
                 // Refresh the image
                 if (type === 'avatar') {
                     setAvatarUrl(`${API_URL}/api/avatar/get/file/${response.data}?t=${new Date().getTime()}`);
                 } else {
                     setSealUrl(`${API_URL}/api/seal/get/file/${response.data}?t=${new Date().getTime()}`);
                 }
            }
        } catch (error) {
            message.error('خطا در آپلود فایل.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row gutter={[24, 24]}>
            {/* Avatar Upload */}
            <Col xs={24} md={12}>
                <Card title="تنظیمات نمایه (لوگو)">
                    <p>نمایه در بالای فاکتورها و اسناد نمایش داده می‌شود.</p>
                    <Image width={150} src={avatarUrl} fallback="/path/to/default/image.png" style={{ marginBottom: 16 }}/>
                    <Upload
                        customRequest={(options) => handleUpload(options, 'avatar')}
                        showUploadList={false}
                        accept=".png,.jpg,.jpeg"
                    >
                        <Button icon={<UploadOutlined />} loading={loading}>انتخاب و ذخیره نمایه</Button>
                    </Upload>
                </Card>
            </Col>

            {/* Seal Upload */}
            <Col xs={24} md={12}>
                 <Card title="تنظیمات مهر کسب‌وکار">
                    <p>مهر در پایین اسناد حسابداری درج می‌شود.</p>
                     <Image width={150} src={sealUrl} fallback="/path/to/default/image.png" style={{ marginBottom: 16 }} />
                    <Upload
                        customRequest={(options) => handleUpload(options, 'seal')}
                        showUploadList={false}
                        accept=".png,.jpg,.jpeg"
                    >
                        <Button icon={<UploadOutlined />} loading={loading}>انتخاب و ذخیره مهر</Button>
                    </Upload>
                </Card>
            </Col>
        </Row>
    );
};

export default AvatarSettings;