import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  property?: (item: T) => unknown;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    @if (items().length === 0) {
      <app-empty-state [title]="emptyTitle()" [message]="emptyMessage()" />
    } @else {
      <div class="table-container">
        <table class="app-table">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th scope="col" [class]="'align-' + (col.align || 'left')">
                  {{ col.header }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (item of pagedItems(); track $index) {
              <tr>
                @for (col of columns(); track col.key) {
                  <td [class]="'align-' + (col.align || 'left')">
                    {{ getCellContent(item, col) }}
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>

        @if (totalPages() > 1) {
          <footer class="table-pagination">
            <span class="pagination-info">
              Página {{ currentPage() }} de {{ totalPages() }} ({{ items().length }} registros)
            </span>
            <div class="pagination-controls">
              <button
                mat-icon-button
                type="button"
                [disabled]="currentPage() === 1"
                (click)="prevPage()"
                aria-label="Página anterior"
              >
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                [disabled]="currentPage() === totalPages()"
                (click)="nextPage()"
                aria-label="Página siguiente"
              >
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </footer>
        }
      </div>
    }
  `,
  styles: [
    `
      .table-container {
        width: 100%;
        overflow-x: auto;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
      .app-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      th {
        background-color: #f8fafc;
        color: #475569;
        font-weight: 600;
        padding: 0.75rem 1rem;
        border-bottom: 2px solid #e2e8f0;
      }
      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
      }
      tr:hover td {
        background-color: #f8fafc;
      }
      .align-left { text-align: left; }
      .align-center { text-align: center; }
      .align-right { text-align: right; }
      .table-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.875rem;
        color: #475569;
      }
      .pagination-controls {
        display: flex;
        gap: 0.25rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly items = input.required<T[]>();
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly pageSize = input<number>(10);
  readonly emptyTitle = input<string>('No hay datos disponibles');
  readonly emptyMessage = input<string>('No se encontraron registros para mostrar.');

  readonly currentPage = signal<number>(1);

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.items().length / this.pageSize()));
  });

  readonly pagedItems = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.items().slice(start, start + size);
  });

  getCellContent(item: T, col: DataTableColumn<T>): string {
    if (col.property) {
      const val = col.property(item);
      return val === null || val === undefined ? '-' : String(val);
    }
    const direct = item[col.key];
    return direct === null || direct === undefined ? '-' : String(direct);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }
}
