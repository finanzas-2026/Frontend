import { z } from 'zod';

export const SimulatedInstallmentResourceSchema = z.object({
  id: z.number().optional().default(0),
  installment_number: z.number(),
  due_date: z.string(),
  payment_amount: z.string(),
  principal_amount: z.string(),
  interest_amount: z.string(),
  balance_amount: z.string(),
  is_grace_period: z.boolean(),
});

export const SimulateScheduleResponseSchema = z.object({
  initial_capital: z.string(),
  capitalized_capital: z.string(),
  grace_days: z.number(),
  total_installments: z.number(),
  tea: z.string(),
  ted: z.string(),
  tep_30: z.string(),
  regular_installment: z.string(),
  total_interest: z.string(),
  total_payment: z.string(),
  installments: z.array(SimulatedInstallmentResourceSchema),
});
