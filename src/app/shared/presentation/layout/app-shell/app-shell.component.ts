import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  context: 'financing' | 'sales' | 'settlements' | 'analytics';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav mode="side" [opened]="isSidenavOpen()" class="shell-sidenav">
        <header class="sidenav-header">
          <div class="brand-title">Crédito Proximidad</div>
          <div class="brand-subtitle">UPC — Grupo 5</div>
        </header>

        <nav class="sidenav-nav" aria-label="Navegación principal">
          <mat-nav-list>
            <div class="nav-group-label">Inteligencia Gerencial</div>
            <a mat-list-item routerLink="/analytics/dashboard" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard MIS</span>
            </a>
            <a mat-list-item routerLink="/analytics/audit" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>history</mat-icon>
              <span matListItemTitle>Auditoría de Movimientos</span>
            </a>

            <div class="nav-group-label">Ventas y Mostrador</div>
            <a mat-list-item routerLink="/sales/pos" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>point_of_sale</mat-icon>
              <span matListItemTitle>Mostrador POS</span>
            </a>
            <a mat-list-item routerLink="/sales/history" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Historial de Ventas</span>
            </a>

            <div class="nav-group-label">Financiamiento Francés</div>
            <a mat-list-item routerLink="/financing/simulator" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>calculate</mat-icon>
              <span matListItemTitle>Simulador de Cuotas</span>
            </a>

            <div class="nav-group-label">Liquidaciones y Cobro</div>
            <a mat-list-item routerLink="/settlements/desk" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>payments</mat-icon>
              <span matListItemTitle>Ventanilla de Cobro</span>
            </a>
            <a mat-list-item routerLink="/settlements/list" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
              <span matListItemTitle>Cierres Mensuales</span>
            </a>
            <a mat-list-item routerLink="/settlements/portal" routerLinkActive="active-nav-link">
              <mat-icon matListItemIcon>person_search</mat-icon>
              <span matListItemTitle>Portal del Cliente</span>
            </a>
          </mat-nav-list>
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="shell-content">
        <mat-toolbar color="primary" class="shell-toolbar">
          <button
            mat-icon-button
            type="button"
            (click)="toggleSidenav()"
            aria-label="Alternar menú lateral"
          >
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">Sistema de Gestión de Cuentas Corrientes</span>
          <span class="toolbar-spacer"></span>
          <div class="user-badge" aria-label="Usuario activo">
            <mat-icon aria-hidden="true">account_circle</mat-icon>
            <span class="user-role">Tienda #1 (Bodega)</span>
          </div>
        </mat-toolbar>

        <main class="page-content" role="main">
          <router-outlet />
        </main>

        <nav class="mobile-bottom-bar" aria-label="Navegación móvil rápida">
          <a routerLink="/analytics/dashboard" routerLinkActive="active-mobile-link" class="mobile-item">
            <mat-icon>dashboard</mat-icon>
            <span>MIS</span>
          </a>
          <a routerLink="/sales/pos" routerLinkActive="active-mobile-link" class="mobile-item">
            <mat-icon>point_of_sale</mat-icon>
            <span>POS</span>
          </a>
          <a routerLink="/financing/simulator" routerLinkActive="active-mobile-link" class="mobile-item">
            <mat-icon>calculate</mat-icon>
            <span>Simulador</span>
          </a>
          <a routerLink="/settlements/desk" routerLinkActive="active-mobile-link" class="mobile-item">
            <mat-icon>payments</mat-icon>
            <span>Caja</span>
          </a>
        </nav>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell-container {
        height: 100vh;
        width: 100%;
      }
      .shell-sidenav {
        width: 280px;
        background: #0f172a;
        color: #f8fafc;
        border-right: none;
      }
      .sidenav-header {
        padding: 1.5rem 1rem 1rem;
        border-bottom: 1px solid #1e293b;
      }
      .brand-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #38bdf8;
      }
      .brand-subtitle {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }
      .nav-group-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        padding: 1rem 1rem 0.25rem;
        font-weight: 600;
      }
      mat-nav-list a {
        color: #cbd5e1 !important;
        border-radius: 6px;
        margin: 2px 8px;
      }
      mat-nav-list a mat-icon {
        color: #94a3b8;
      }
      mat-nav-list a.active-nav-link {
        background-color: #0284c7 !important;
        color: #ffffff !important;
      }
      mat-nav-list a.active-nav-link mat-icon {
        color: #ffffff !important;
      }
      .shell-content {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: #f1f5f9;
      }
      .shell-toolbar {
        background: #0284c7;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .toolbar-title {
        margin-left: 0.75rem;
        font-size: 1.125rem;
        font-weight: 600;
      }
      .toolbar-spacer {
        flex: 1 1 auto;
      }
      .user-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
      .page-content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
      }
      .mobile-bottom-bar {
        display: none;
      }

      @media (max-width: 768px) {
        .shell-sidenav {
          display: none;
        }
        .page-content {
          padding: 1rem;
          padding-bottom: 4rem;
        }
        .mobile-bottom-bar {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          justify-content: space-around;
          align-items: center;
          z-index: 20;
        }
        .mobile-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #64748b;
          font-size: 0.6875rem;
        }
        .mobile-item.active-mobile-link {
          color: #0284c7;
          font-weight: 600;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly isSidenavOpen = signal<boolean>(true);

  toggleSidenav(): void {
    this.isSidenavOpen.update((v) => !v);
  }
}
