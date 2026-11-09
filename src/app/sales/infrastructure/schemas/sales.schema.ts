import { z } from 'zod';

export const createSaleDetailSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Formato de precio inválido'),
});

export const createSaleSchema = z.object({
  customer_id: z.number().int().positive(),
  store_id: z.number().int().positive(),
  payment_mode: z.enum(['CONTADO', 'FINANCIADO_MENSUAL', 'FINANCIADO_CUOTAS']),
  installments_count: z.number().int().positive().optional(),
  grace_days: z.number().int().nonnegative().optional(),
  tea: z.string().optional(),
  details: z.array(createSaleDetailSchema).min(1, 'La venta debe contener al menos un detalle'),
});

export const saleDetailResponseSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  sku: z.string(),
  unit_price: z.string(),
  quantity: z.number(),
  subtotal: z.string(),
});

export const saleResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  customer_id: z.number(),
  customer_name: z.string(),
  store_id: z.number(),
  payment_mode: z.enum(['CONTADO', 'FINANCIADO_MENSUAL', 'FINANCIADO_CUOTAS']),
  total_amount: z.string(),
  status: z.string(),
  installments_count: z.number().optional(),
  grace_days: z.number().optional(),
  tea: z.string().optional(),
  issue_date: z.string(),
  details: z.array(saleDetailResponseSchema),
});

export const customerCreditInfoSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  document_number: z.string(),
  credit_limit: z.string(),
  current_debt: z.string(),
  allows_monthly_payments: z.boolean(),
});

export const catalogProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  unit_price: z.string(),
  stock: z.number(),
});
