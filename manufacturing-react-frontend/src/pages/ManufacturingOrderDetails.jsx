// src/pages/ManufacturingOrderDetails.jsx
import React from "react";
import { useParams } from "react-router-dom";

export default function ManufacturingOrderDetails() {
  const { id } = useParams();

  return (
    <div style={{ padding: "20px" }}>
      <h2>{id === "new" ? "New Manufacturing Order" : `Manufacturing Order: ${id}`}</h2>
      {/* Add all order details, tabs, components, work orders etc here */}
      <p>This is the manufacturing order detail view.</p>
    </div>
  );
}
