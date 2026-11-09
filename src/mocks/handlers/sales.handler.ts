import { http, HttpResponse } from 'msw';
import { inMemoryDb } from '../in-memory-db';

export const salesHandlers = [
  http.get('*/api/v1/customers', () => {
    const customers = inMemoryDb.getCustomers();
    return HttpResponse.json(customers, { status: 200 });
  }),

  http.get('*/api/v1/catalog/products', () => {
    const products = inMemoryDb.getProducts();
    return HttpResponse.json(products, { status: 200 });
  }),

  http.get('*/api/v1/sales', () => {
    const sales = inMemoryDb.getSales();
    return HttpResponse.json(sales, { status: 200 });
  }),

  http.get('*/api/v1/sales/:id', ({ params }) => {
    const id = Number(params['id']);
    const sale = inMemoryDb.getSaleById(id);
    if (!sale) {
      return HttpResponse.json(
        { code: 'SALE_NOT_FOUND', message: `Venta #${id} no encontrada` },
        { status: 404 }
      );
    }
    return HttpResponse.json(sale, { status: 200 });
  }),

  http.post('*/api/v1/sales', async ({ request }) => {
    try {
      const body = (await request.json()) as {
        customer_id: number;
        store_id: number;
        payment_mode: 'CONTADO' | 'FINANCIADO_MENSUAL' | 'FINANCIADO_CUOTAS';
        installments_count?: number;
        grace_days?: number;
        tea?: string;
        details: { product_id: number; quantity: number; unit_price: string }[];
      };

      const { sale } = inMemoryDb.createSale(body);
      return HttpResponse.json(sale, { status: 201 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar la venta';
      return HttpResponse.json(
        { code: 'SALE_REJECTED', message },
        { status: 422 }
      );
    }
  }),
];
