import { z } from 'zod';

export const dashboardKpisSchema = z.object({
  total_revenue: z.string(),
  overdue_portfolio: z.string(),
  active_accounts: z.number(),
  default_rate: z.string(),
});

export const monthlyFlowSchema = z.object({
  month: z.string(),
  sales_amount: z.string(),
  collected_amount: z.string(),
});

export const auditMovementSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  event_type: z.enum(['SALE_CREATED', 'SETTLEMENT_CUTOFF', 'PAYMENT_RECEIVED']),
  customer_name: z.string(),
  amount: z.string(),
  description: z.string(),
});
