import React from "react";
import OrderBook from "../components/order-book/OrderBook";
import "./OrderBookPage.css";
import { useTranslation } from "react-i18next";
const OrderBookPage = () => {
  const { t } = useTranslation();
  return (
    <div className="order-book-page">
      <div className="order-book-header">
        <h1>Order Book</h1>
        <p className="order-book-subtitle">{t('orderBook.title')}</p>
      </div>

      <div className="order-book-container">
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
          <OrderBook type="GOLD" />
          <OrderBook type="SILVER" />
        </div>
      </div>
    </div>
  );
};

export default OrderBookPage;
