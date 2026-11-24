import { UiIconComponent } from '../../../../shared/presentation/components/ui-icon/ui-icon.component';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  ToastService,
} from '@shared/index';
import { TenantStore } from '../../../application/stores/tenant.store';
import { Store } from '../../../domain/model/store.entity';
import { StoreStatuses } from '../../../domain/enums/store-status.enum';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [UiIconComponent, MatButtonModule, MatCardModule, RouterLink, EmptyStateComponent, LoadingStateComponent, PageHeaderComponent],
  templateUrl: './store-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreListPage implements OnInit {
  readonly store = inject(TenantStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    void this.loadStores();
  }

  async loadStores(): Promise<void> {
    try {
      await this.store.loadTenants();
    } catch {
      // TenantStore exposes the message to the page.
    }
  }

  async deactivate(store: Store): Promise<void> {
    if (store.status !== StoreStatuses.ACTIVE || this.store.isLoading()) return;
    const dialog = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desactivar tienda',
        message: `La tienda “${store.businessName}” dejará de estar disponible para operar.`,
        confirmText: 'Desactivar',
        cancelText: 'Cancelar',
        isDestructive: true,
      },
    });
    if (!(await firstValueFrom(dialog.afterClosed()))) return;
    try {
      await this.store.deactivateTenant(store.id);
      this.toast.success('Tienda desactivada correctamente.');
    } catch {
      this.toast.error(this.store.error() ?? 'No se pudo desactivar la tienda.');
    }
  }

  statusLabel(status: Store['status']): string {
    switch (status) {
      case StoreStatuses.ACTIVE: return 'Activa';
      case StoreStatuses.SUSPENDED: return 'Suspendida';
      case StoreStatuses.INACTIVE: return 'Inactiva';
    }
  }
}
