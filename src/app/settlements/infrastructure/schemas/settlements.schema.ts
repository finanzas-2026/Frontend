import { z } from 'zod';

export const settlementResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  customer_id: z.number(),
  customer_name: z.string(),
  cutoff_date: z.string(),
  due_date: z.string(),
  principal_amount: z.string(),
  compensatory_interest: z.string(),
  penalty_amount: z.string(),
  total_due: z.string(),
  status: z.enum(['PENDING', 'OVERDUE', 'PAID']),
  paid_date: z.string().optional(),
});

export const payoffQuoteResponseSchema = z.object({
  settlement_id: z.number(),
  calculation_date: z.string(),
  days_overdue: z.number(),
  overdue_principal: z.string(),
  compensatory_interest: z.string(),
  moratorium_interest: z.string(),
  total_payoff_amount: z.string(),
});

export const paymentResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  settlement_id: z.number(),
  customer_id: z.number(),
  amount: z.string(),
  payment_date: z.string(),
  payment_method: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'YAPE']),
  reference_number: z.string().optional(),
  receipt_number: z.string(),
});
