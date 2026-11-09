import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingStateComponent } from './components/loading-state/loading-state.component';
import { DataTableComponent, DataTableColumn } from './components/data-table/data-table.component';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { provideRouter } from '@angular/router';

describe('Shared Presentation Components', () => {
  it('PageHeaderComponent should render title and subtitle', async () => {
    await render(PageHeaderComponent, {
      inputs: {
        title: 'Ventas de Hoy',
        subtitle: 'Resumen operativo de caja',
      },
    });

    expect(screen.getByText('Ventas de Hoy')).toBeTruthy();
    expect(screen.getByText('Resumen operativo de caja')).toBeTruthy();
  });

  it('EmptyStateComponent should render empty state text', async () => {
    await render(EmptyStateComponent, {
      inputs: {
        title: 'Sin deudas registradas',
        message: 'El cliente no tiene cuotas pendientes de pago.',
      },
    });

    expect(screen.getByText('Sin deudas registradas')).toBeTruthy();
    expect(screen.getByText('El cliente no tiene cuotas pendientes de pago.')).toBeTruthy();
  });

  it('LoadingStateComponent should render loading spinner and message', async () => {
    await render(LoadingStateComponent, {
      inputs: {
        message: 'Calculando cronograma francés...',
      },
    });

    expect(screen.getByText('Calculando cronograma francés...')).toBeTruthy();
  });

  it('DataTableComponent should render table headers, rows, and paginate', async () => {
    interface TestRow extends Record<string, unknown> {
      id: number;
      code: string;
      total: number;
    }

    const columns: DataTableColumn<TestRow>[] = [
      { key: 'code', header: 'Código' },
      { key: 'total', header: 'Total', property: (item) => `S/ ${item.total}` },
    ];

    const items: TestRow[] = [
      { id: 1, code: 'V-001', total: 100 },
      { id: 2, code: 'V-002', total: 200 },
      { id: 3, code: 'V-003', total: 300 },
    ];

    await render(DataTableComponent<TestRow>, {
      inputs: {
        items,
        columns,
        pageSize: 2,
      },
    });

    expect(screen.getByText('Código')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('V-001')).toBeTruthy();
    expect(screen.getByText('S/ 100')).toBeTruthy();
    expect(screen.getByText('V-002')).toBeTruthy();

    // Next page button
    const nextBtn = screen.getByLabelText('Página siguiente');
    await fireEvent.click(nextBtn);

    expect(screen.getByText('V-003')).toBeTruthy();
    expect(screen.getByText('S/ 300')).toBeTruthy();
  });

  it('AppShellComponent should toggle sidebar on button click', async () => {
    await render(AppShellComponent, {
      providers: [provideRouter([])],
    });

    expect(screen.getByText('Crédito Proximidad')).toBeTruthy();
    const toggleBtn = screen.getByLabelText('Alternar menú lateral');
    await fireEvent.click(toggleBtn);
  });
});
