import React, { createContext, useState, useContext } from "react";

// Create context
const OrdersContext = createContext();

// Provider
export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  const addOrder = (order) => setOrders([...orders, order]);
  const updateOrder = (idx, updatedOrder) => {
    const newOrders = [...orders];
    newOrders[idx] = updatedOrder;
    setOrders(newOrders);
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrder }}>
      {children}
    </OrdersContext.Provider>
  );
};

// Hook to use context
export const useOrders = () => useContext(OrdersContext);
