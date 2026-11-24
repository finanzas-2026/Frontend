import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { UiIconComponent } from '../ui-icon/ui-icon.component';
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
  imports: [CommonModule, MatButtonModule, UiIconComponent, EmptyStateComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
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
