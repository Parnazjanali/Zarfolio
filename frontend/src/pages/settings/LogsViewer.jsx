import React, { useState, useEffect } from 'react';
import { Table, Input, Spin, Typography } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { Search } = Input;

const LogsViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const response = await axios.post('/api/business/logs/' + localStorage.getItem('activeBid'));
                setLogs(response.data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const columns = [
        { title: 'تاریخ', dataIndex: 'date', key: 'date', align: 'center' },
        { title: 'کاربر', dataIndex: 'user', key: 'user', align: 'center' },
        { title: 'توضیحات', dataIndex: 'des', key: 'des', align: 'center' },
        { title: 'بخش', dataIndex: 'part', key: 'part', align: 'center' },
        { title: 'آی پی آدرس', dataIndex: 'ipaddress', key: 'ipaddress', align: 'center' },
    ];

    const filteredLogs = logs.filter(log =>
        Object.values(log).some(val =>
            String(val).toLowerCase().includes(searchText.toLowerCase())
        )
    );

    return (
        <div>
            <Title level={4}>تاریخچه رویدادها</Title>
            <Search
                placeholder="جستجو در رویدادها..."
                onChange={e => setSearchText(e.target.value)}
                style={{ marginBottom: 16 }}
            />
            {loading ? <Spin /> : (
                <Table
                    columns={columns}
                    dataSource={filteredLogs}
                    rowKey={(record, index) => index} // Assuming logs don't have a unique ID
                    bordered
                />
            )}
        </div>
    );
};

export default LogsViewer;