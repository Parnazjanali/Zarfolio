// src/components/AiResponseRenderer.jsx
import React from 'react';
import { Table, Typography } from 'antd';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Paragraph, Title } = Typography;

const AiResponseRenderer = ({ response }) => {
    if (!response || !Array.isArray(response.data)) {
        return <Paragraph>پاسخ نامعتبر دریافت شد.</Paragraph>;
    }

    return (
        <div>
            {response.data.map((item, index) => {
                switch (item.type) {
                    case 'text':
                        return <Paragraph key={index}>{item.content}</Paragraph>;
                    case 'table':
                        const columns = item.headers.map((header, i) => ({ title: header, dataIndex: i, key: i }));
                        const dataSource = item.rows.map((row, i) => ({ key: i, ...row }));
                        return <Table key={index} columns={columns} dataSource={dataSource} pagination={false} size="small" bordered style={{marginBottom: '1em'}} />;
                    case 'chart':
                        return (
                            <div key={index} style={{marginTop: '1em', marginBottom: '1em'}}>
                                {item.title && <Title level={5} style={{textAlign: 'center'}}>{item.title}</Title>}
                                <ResponsiveContainer width="100%" height={250}>
                                    {item.chartType === 'bar' ? (
                                        <BarChart data={item.data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey={Object.keys(item.data[0])[1]} fill="#8884d8" />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={item.data}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey={Object.keys(item.data[0])[1]} stroke="#82ca9d" />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        );
                    // +++ کیس جدید برای نمایش کد +++
                    case 'code':
                        return (
                            <div key={index} className="code-block-container">
                                <SyntaxHighlighter language={item.language} style={atomDark} showLineNumbers>
                                    {item.content}
                                </SyntaxHighlighter>
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </div>
    );
};

export default AiResponseRenderer;