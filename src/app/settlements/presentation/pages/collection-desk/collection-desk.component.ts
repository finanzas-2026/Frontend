import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  EmptyStateComponent,
  LoadingStateComponent,
  PageHeaderComponent,
} from '@shared/index';
import { CollectionStore } from '../../state/collection.store';

@Component({
  selector: 'app-collection-desk',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './collection-desk.component.html',
  styleUrl: './collection-desk.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDeskPageComponent implements OnInit {
  readonly store = inject(CollectionStore);
  referenceInput = '';

  ngOnInit(): void {
    void this.store.loadSettlements();
  }

  onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setAmountToPay(input.value);
  }

  async onPay(): Promise<void> {
    this.store.referenceNumber.set(this.referenceInput);
    await this.store.processPayment();
  }

  onPrint(): void {
    window.print();
  }
}
