// src/pages/AiAssistantPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Avatar, List, Spin, Card, Tag, Modal, App, Tooltip } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, CommentOutlined, DeleteOutlined, StopOutlined, RedoOutlined } from '@ant-design/icons';
import AiResponseRenderer from '../components/AiResponseRenderer';
import './AiAssistantPage.css';

// شبیه‌ساز API با پاسخ‌های متنوع‌تر
const mockApi = async (message) => {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    if (message.includes("گزارش فروش")) {
        return { type: ['text', 'chart'], data: [{ type: 'text', content: 'البته، این گزارش فروش هفتگی شماست:' }, { type: 'chart', chartType: 'bar', title: 'گزارش فروش هفتگی', data: [{ name: 'شنبه', فروش: 4000 + Math.random() * 1000 }, { name: 'یکشنبه', فروش: 3000 }, { name: 'دوشنبه', فروش: 2000 }, { name: 'سه‌شنبه', فروش: 2780 }, { name: 'چهارشنبه', فروش: 1890 }, { name: 'پنجشنبه', فروش: 2390 }, { name: 'جمعه', فروش: 3490 }] }] };
    }
    if (message.includes("موجودی")) {
        return { type: ['text', 'table'], data: [{ type: 'text', content: 'جدول موجودی کالاهای اصلی به شرح زیر است:' }, { type: 'table', headers: ['کد کالا', 'نام کالا', 'موجودی', 'وضعیت'], rows: [['GOLD-R-01', 'انگشتر پایه ازدواج', '5 عدد', 'موجود'], ['GOLD-N-05', 'گردنبند مروارید', '2 عدد', 'رو به اتمام'], ['SILVER-B-12', 'دستبند نقره کارتیه', '15 عدد', 'موجود']] }] };
    }
    if (message.includes("کد")) {
        return { type: ['text', 'code'], data: [{ type: 'text', content: 'حتما! این یک نمونه کد جاوااسکریپت برای محاسبه جمع دو عدد است:' }, { type: 'code', language: 'javascript', content: `function sum(a, b) {\n  // This function calculates the sum of two numbers.\n  return a + b;\n}\n\nconst result = sum(5, 10);\nconsole.log(result); // Output: 15` }] };
    }
    return { type: ['text'], data: [{ type: 'text', content: `پاسخ به پیام شما «${message}»: من یک دستیار هوش مصنوعی هستم که برای کمک به شما طراحی شده‌ام. پاسخ‌ها ممکن است هر بار کمی متفاوت باشند.` }] };
};

const AiAssistantPage = () => {
    const { message: antMessage, modal } = App.useApp();
    const [messages, setMessages] = useState([{ type: 'ai', data: { type: ['text'], data: [{ type: 'text', content: 'سلام! من دستیار هوشمند شما هستم. چطور می‌توانم کمکتان کنم؟' }] }, timestamp: new Date() }]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [lastUserMessage, setLastUserMessage] = useState('');
    const stopGeneratingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages, isTyping]);
    
    const sendMessage = async (content) => {
        const messageContent = content.trim();
        if (!messageContent || isTyping) return;

        setNewMessage('');
        setLastUserMessage(messageContent);
        setMessages(prev => [...prev, { type: 'user', text: messageContent, timestamp: new Date() }]);
        
        setIsTyping(true);
        stopGeneratingRef.current = false;

        const res = await mockApi(messageContent);

        if (stopGeneratingRef.current) {
            setIsTyping(false);
            stopGeneratingRef.current = false;
            return;
        }

        setIsTyping(false);
        setMessages(prev => [...prev, { type: 'ai', data: res, timestamp: new Date() }]);
    };

    const handleSendMessage = () => sendMessage(newMessage);
    const handleRegenerate = () => {
        if (lastUserMessage && !isTyping) {
            // حذف آخرین پاسخ هوش مصنوعی برای جایگزینی
            setMessages(prev => prev.filter((_, i) => i !== prev.length -1));
            sendMessage(lastUserMessage);
        }
    };

    const handleStopGenerating = () => {
        if (isTyping) {
            stopGeneratingRef.current = true;
            antMessage.warning('تولید پاسخ متوقف شد.');
        }
    };

    const quickSuggestions = ['یک گزارش فروش هفتگی برایم بساز', 'موجودی انبار چطور است؟', 'یک نمونه کد به من نشان بده'];

    return (
        <div className="ai-chat-container">
            <div className="ai-messages-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`ai-message ${msg.type}`}>
                        <Avatar icon={msg.type === 'ai' ? <RobotOutlined /> : <UserOutlined />} className="ai-message-avatar" />
                        <div className="ai-message-content">
                            <div className="ai-message-bubble">
                                {msg.type === 'user' ? <p>{msg.text}</p> : <AiResponseRenderer response={msg.data} />}
                                <span className="ai-message-time">{msg.timestamp.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {/* دکمه تولید مجدد برای آخرین پیام هوش مصنوعی */}
                            {msg.type === 'ai' && index === messages.length - 1 && !isTyping && (
                                <Tooltip title="تولید مجدد پاسخ">
                                    <Button className="ai-action-btn" type="text" shape="circle" icon={<RedoOutlined />} onClick={handleRegenerate} />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                     <div className="ai-message ai">
                        <Avatar icon={<RobotOutlined />} className="ai-message-avatar" />
                        <div className="ai-message-content">
                            <div className="ai-message-bubble typing"><Spin size="small" /></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-container">
                <div className="ai-quick-actions">
                    {quickSuggestions.map(s => <Tag key={s} onClick={() => sendMessage(s)} className="ai-quick-chip">{s}</Tag>)}
                </div>
                <div className="ai-input-wrapper">
                    <Input.TextArea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        autoSize={{ maxRows: 3 }}
                        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        disabled={isTyping}
                    />
                    {isTyping ? (
                        <Button type="default" danger icon={<StopOutlined />} onClick={handleStopGenerating}>توقف</Button>
                    ) : (
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} disabled={!newMessage.trim()} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiAssistantPage;