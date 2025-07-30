// frontend/src/pages/BankCardsPage.jsx

import React, { useState } from 'react';
import CreditCard from '../components/CreditCard';
import AddCardModal from '../components/AddCardModal'; // مودال را وارد می‌کنیم
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

// داده‌های نمونه برای نمایش اولیه
const sampleCards = [
  { id: 1, number: '1234 5678 9101 1121', name: 'رضا محمدی', expiry: '12/28', cvv: '123' },
  { id: 2, number: '9876 5432 1098 7654', name: 'سارا احمدی', expiry: '06/27', cvv: '456' },
];

const BankCardsPage = () => {
  const [cards, setCards] = useState(sampleCards);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // وضعیت نمایش مودال

  const handleCardClick = (cardId) => {
    setFlippedCardId(prevId => (prevId === cardId ? null : cardId));
  };

  // تابع برای نمایش مودال
  const showModal = () => {
    setIsModalVisible(true);
  };

  // تابع برای بستن مودال
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // تابع برای افزودن کارت جدید
  const handleAddCard = (newCardData) => {
    const newCard = {
      id: Date.now(), // یک شناسه یکتا برای کارت جدید
      ...newCardData,
    };
    setCards([...cards, newCard]);
    setIsModalVisible(false); // بستن مودال پس از افزودن
    message.success('کارت جدید با موفقیت اضافه شد!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>کارت‌های بانکی من</h2>
        {/* دکمه افزودن، مودال را باز می‌کند */}
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          افزودن کارت جدید
        </Button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {cards.map(card => (
          <CreditCard
            key={card.id}
            card={card}
            isFlipped={flippedCardId === card.id}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>

      {/* مودال را به صفحه اضافه می‌کنیم */}
      <AddCardModal
        visible={isModalVisible}
        onCancel={handleCancel}
        onOk={handleAddCard}
      />
    </div>
  );
};

export default BankCardsPage;