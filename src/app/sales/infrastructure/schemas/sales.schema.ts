import { z } from 'zod';

export const createSaleDetailSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const createSaleSchema = z.object({
  customer_id: z.number().int().positive(),
  payment_mode: z.enum(['CASH', 'MONTH_END', 'INSTALLMENTS']),
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
  payment_mode: z.enum(['CASH', 'MONTH_END', 'INSTALLMENTS']),
  total_amount: z.string(),
  month_end_interest: z.string().optional(),
  first_due_date: z.string().optional(),
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
  max_credit_months: z.number().int().positive().optional(),
  compensatory_rate_type: z.enum(['NOMINAL', 'EFFECTIVE']).optional(),
  compensatory_rate_value: z.string().optional(),
  compensatory_rate_period_days: z.number().optional(),
  compensatory_capitalization_days: z.number().nullable().optional(),
});

export const catalogProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  unit_price: z.string(),
  credit_unit_price: z.string().optional(),
  allows_installments: z.boolean(),
  stock: z.number(),
});
