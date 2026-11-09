import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolCurrencyPipe } from '@shared/index';
import { Installment } from '../../../domain/model/installment.entity';

@Component({
  selector: 'app-schedule-table',
  standalone: true,
  imports: [CommonModule, SolCurrencyPipe],
  template: `
    <div class="schedule-container">
      <div class="desktop-view">
        <table class="schedule-table">
          <thead>
            <tr>
              <th scope="col">N° Cuota</th>
              <th scope="col">Vencimiento</th>
              <th scope="col" class="align-right">Cuota Total (R)</th>
              <th scope="col" class="align-right">Amortización (A)</th>
              <th scope="col" class="align-right">Interés (I)</th>
              <th scope="col" class="align-right">Saldo Insoluto (S)</th>
            </tr>
          </thead>
          <tbody>
            @for (item of installments(); track item.installmentNumber) {
              <tr [class.grace-row]="item.isGracePeriod">
                <td>
                  @if (item.isGracePeriod) {
                    <span class="badge-grace">0 (Gracia Total)</span>
                  } @else {
                    <strong>{{ item.installmentNumber }}</strong>
                  }
                </td>
                <td>{{ item.dueDate }}</td>
                <td class="align-right">
                  <strong>{{ item.paymentAmount | solCurrency }}</strong>
                </td>
                <td class="align-right">{{ item.principalAmount | solCurrency }}</td>
                <td class="align-right">{{ item.interestAmount | solCurrency }}</td>
                <td class="align-right">
                  <strong>{{ item.balanceAmount | solCurrency }}</strong>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="mobile-view">
        @for (item of installments(); track item.installmentNumber) {
          <article class="installment-card" [class.grace-card]="item.isGracePeriod">
            <header class="card-header">
              <span class="card-number">
                @if (item.isGracePeriod) {
                  Cuota 0 — Gracia Total
                } @else {
                  Cuota #{{ item.installmentNumber }}
                }
              </span>
              <span class="card-date">{{ item.dueDate }}</span>
            </header>
            <div class="card-body">
              <div class="metric-row">
                <span class="label">Cuota (R):</span>
                <span class="val highlight">{{ item.paymentAmount | solCurrency }}</span>
              </div>
              <div class="metric-row">
                <span class="label">Amortización (A):</span>
                <span class="val">{{ item.principalAmount | solCurrency }}</span>
              </div>
              <div class="metric-row">
                <span class="label">Interés (I):</span>
                <span class="val">{{ item.interestAmount | solCurrency }}</span>
              </div>
              <div class="metric-row footer-row">
                <span class="label">Saldo Final (S):</span>
                <span class="val balance">{{ item.balanceAmount | solCurrency }}</span>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .schedule-container {
        width: 100%;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
      }
      .schedule-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }
      th {
        background-color: #0f172a;
        color: #f8fafc;
        padding: 0.875rem 1rem;
        font-weight: 600;
        text-align: left;
      }
      td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        color: #1e293b;
      }
      tr:hover td {
        background-color: #f8fafc;
      }
      .align-right {
        text-align: right;
      }
      .grace-row {
        background-color: #fef3c7 !important;
      }
      .badge-grace {
        background-color: #92400e;
        color: #ffffff;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
      }
      .mobile-view {
        display: none;
        padding: 0.5rem;
        gap: 0.75rem;
        flex-direction: column;
      }
      .installment-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .grace-card {
        border-color: #f59e0b;
        background-color: #fffbeb;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        margin-bottom: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 0.5rem;
      }
      .card-number {
        color: #0f172a;
      }
      .card-date {
        color: #64748b;
        font-size: 0.8125rem;
      }
      .metric-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.875rem;
      }
      .highlight {
        font-weight: 700;
        color: #0284c7;
      }
      .balance {
        font-weight: 700;
        color: #0f172a;
      }
      .footer-row {
        border-top: 1px dashed #cbd5e1;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
      }

      @media (max-width: 768px) {
        .desktop-view {
          display: none;
        }
        .mobile-view {
          display: flex;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleTableComponent {
  readonly installments = input.required<readonly Installment[]>();
}
