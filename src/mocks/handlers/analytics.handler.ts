import { http, HttpResponse } from 'msw';

export const analyticsHandlers = [
  http.get('*/api/v1/analytics/kpis', () => {
    return HttpResponse.json(
      {
        total_revenue: '14850.00',
        overdue_portfolio: '828.69',
        active_accounts: 42,
        default_rate: '5.5800000',
      },
      { status: 200 }
    );
  }),

  http.get('*/api/v1/analytics/monthly-flows', () => {
    const flows = [
      { month: 'Ene', sales_amount: '12400.00', collected_amount: '11800.00' },
      { month: 'Feb', sales_amount: '13100.00', collected_amount: '12500.00' },
      { month: 'Mar', sales_amount: '14200.00', collected_amount: '13900.00' },
      { month: 'Abr', sales_amount: '12800.00', collected_amount: '12400.00' },
      { month: 'May', sales_amount: '15000.00', collected_amount: '14600.00' },
      { month: 'Jun', sales_amount: '14500.00', collected_amount: '14100.00' },
      { month: 'Jul', sales_amount: '16200.00', collected_amount: '15800.00' },
      { month: 'Ago', sales_amount: '13900.00', collected_amount: '13500.00' },
      { month: 'Set', sales_amount: '14800.00', collected_amount: '14200.00' },
      { month: 'Oct', sales_amount: '15400.00', collected_amount: '14900.00' },
      { month: 'Nov', sales_amount: '14850.00', collected_amount: '14021.31' },
      { month: 'Dic', sales_amount: '18500.00', collected_amount: '17900.00' },
    ];
    return HttpResponse.json(flows, { status: 200 });
  }),

  http.get('*/api/v1/analytics/movements', () => {
    const movements = [
      {
        id: 1,
        timestamp: '2026-11-10T12:05:00Z',
        event_type: 'PAYMENT_RECEIVED',
        customer_name: 'Juan Perez Mamani',
        amount: '828.69',
        description: 'Cancelación total de liquidación LIQ-2026-10-0001 en mora',
      },
      {
        id: 2,
        timestamp: '2026-11-09T16:30:00Z',
        event_type: 'SALE_CREATED',
        customer_name: 'Juan Perez Mamani',
        amount: '450.00',
        description: 'Venta financiada a corte mensual VTA-2026-0002',
      },
      {
        id: 3,
        timestamp: '2026-11-01T10:30:00Z',
        event_type: 'SALE_CREATED',
        customer_name: 'Juan Perez Mamani',
        amount: '70.20',
        description: 'Venta al contado en mostrador VTA-2026-0001',
      },
      {
        id: 4,
        timestamp: '2026-10-31T23:59:59Z',
        event_type: 'SETTLEMENT_CUTOFF',
        customer_name: 'Juan Perez Mamani',
        amount: '800.00',
        description: 'Generación de liquidación de cierre mensual LIQ-2026-10-0001',
      },
    ];
    return HttpResponse.json(movements, { status: 200 });
  }),
];
