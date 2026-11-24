import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
  UiIconComponent,
} from '@shared/index';
import { AuthStore } from '../../../../iam/application/stores/auth.store';
import { CustomerStore } from '../../../application/stores/customer.store';
import { Customer } from '../../../domain/model/customer.entity';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    EmptyStateComponent,
    LoadingStateComponent,
    PageHeaderComponent,
    UiIconComponent,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerList implements OnInit {
  readonly store = inject(CustomerStore);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly searchQuery = signal('');
  readonly hasStore = computed(() => this.authStore.currentStoreId() !== null);
  readonly filteredCustomers = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    return this.store.customers().filter((customer) => {
      if (!query) {
        return true;
      }
      return (
        customer.fullName.toLocaleLowerCase().includes(query) ||
        String(customer.id).includes(query) ||
        customer.phoneNumber.toLocaleLowerCase().includes(query)
      );
    });
  });

  ngOnInit(): void {
    if (this.hasStore()) {
      void this.loadCustomers();
    }
  }

  async loadCustomers(): Promise<void> {
    try {
      await this.store.loadCustomers();
    } catch {
      // CustomerStore exposes the error through its `error` signal.
    }
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onEdit(customer: Customer): void {
    void this.router.navigate(['/credit/customers', customer.id, 'edit']);
  }
}
