import api from "../lib/api";

// GET /api/inventory/products/ — list products (route name: product-list)
export async function listProducts(params) {
  const res = await api.get("/api/inventory/products/", { params });
  return res.data;
}

