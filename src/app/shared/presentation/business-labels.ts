const labelsEs: Readonly<Record<string, string>> = {
  CASH: 'Contado',
  MONTH_END: 'Pago único al cierre',
  INSTALLMENTS: 'En cuotas',
  REGISTERED: 'Registrada',
  SCHEDULED: 'Programada',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencida',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
};

export function businessLabel(value: string): string {
  return labelsEs[value] ?? 'Sin estado';
}
