import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell-layout">
      <!-- Sidenav Desktop -->
      <aside class="shell-sidebar" [class.collapsed]="!isSidenavOpen()" aria-label="Navegación principal">
        <header class="sidebar-header">
          <div class="brand-title">Crédito Proximidad</div>
          <div class="brand-subtitle">UPC — Grupo 5</div>
        </header>

        <nav class="sidebar-nav">
          <div class="nav-group-label">Inteligencia Gerencial</div>
          <a routerLink="/analytics/dashboard" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">📊</span>
            <span>Dashboard MIS</span>
          </a>
          <a routerLink="/analytics/audit" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">📜</span>
            <span>Auditoría de Movimientos</span>
          </a>

          <div class="nav-group-label">Ventas y Mostrador</div>
          <a routerLink="/sales/pos" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">🛒</span>
            <span>Mostrador POS</span>
          </a>
          <a routerLink="/sales/history" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">🧾</span>
            <span>Historial de Ventas</span>
          </a>

          <div class="nav-group-label">Financiamiento Francés</div>
          <a routerLink="/financing/simulator" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">🧮</span>
            <span>Simulador de Cuotas</span>
          </a>

          <div class="nav-group-label">Liquidaciones y Cobro</div>
          <a routerLink="/settlements/desk" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">💳</span>
            <span>Ventanilla de Cobro</span>
          </a>
          <a routerLink="/settlements/list" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">📁</span>
            <span>Cierres Mensuales</span>
          </a>
          <a routerLink="/settlements/portal" routerLinkActive="active-nav-link" class="nav-link">
            <span class="nav-icon" aria-hidden="true">👤</span>
            <span>Portal del Cliente</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <div class="shell-main">
        <header class="shell-toolbar">
          <button
            type="button"
            class="toggle-btn"
            (click)="toggleSidenav()"
            aria-label="Alternar menú lateral"
          >
            ☰
          </button>
          <span class="toolbar-title">Sistema de Gestión de Cuentas Corrientes</span>
          <span class="toolbar-spacer"></span>
          <div class="user-badge" aria-label="Usuario activo">
            <span class="user-icon" aria-hidden="true">🏪</span>
            <span class="user-role">Tienda #1 (Bodega)</span>
          </div>
        </header>

        <main class="page-content" role="main">
          <router-outlet />
        </main>

        <!-- Mobile Bottom Nav -->
        <nav class="mobile-bottom-bar" aria-label="Navegación móvil rápida">
          <a routerLink="/analytics/dashboard" routerLinkActive="active-mobile-link" class="mobile-item">
            <span class="mob-icon">📊</span>
            <span>MIS</span>
          </a>
          <a routerLink="/sales/pos" routerLinkActive="active-mobile-link" class="mobile-item">
            <span class="mob-icon">🛒</span>
            <span>POS</span>
          </a>
          <a routerLink="/financing/simulator" routerLinkActive="active-mobile-link" class="mobile-item">
            <span class="mob-icon">🧮</span>
            <span>Simulador</span>
          </a>
          <a routerLink="/settlements/desk" routerLinkActive="active-mobile-link" class="mobile-item">
            <span class="mob-icon">💳</span>
            <span>Caja</span>
          </a>
        </nav>
      </div>
    </div>
  `,
  styles: [
    `
      .shell-layout {
        display: flex;
        height: 100vh;
        width: 100%;
        overflow: hidden;
      }
      .shell-sidebar {
        width: 270px;
        background: #0f172a;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        transition: width 0.2s ease, transform 0.2s ease;
        flex-shrink: 0;
      }
      .shell-sidebar.collapsed {
        width: 0;
        overflow: hidden;
      }
      .sidebar-header {
        padding: 1.5rem 1.25rem 1rem;
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
      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0.75rem;
      }
      .nav-group-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        padding: 1rem 0.5rem 0.35rem;
        font-weight: 600;
      }
      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 0.75rem;
        color: #cbd5e1;
        text-decoration: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background-color 0.15s, color 0.15s;
        margin-bottom: 2px;
      }
      .nav-link:hover {
        background-color: #1e293b;
        color: #ffffff;
      }
      .nav-link.active-nav-link {
        background-color: #0369a1;
        color: #ffffff;
      }
      .nav-icon {
        font-size: 1.1rem;
      }
      .shell-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
        background-color: #f1f5f9;
      }
      .shell-toolbar {
        height: 56px;
        background: #0369a1;
        color: #ffffff;
        display: flex;
        align-items: center;
        padding: 0 1rem;
        gap: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        z-index: 10;
        flex-shrink: 0;
      }
      .toggle-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
      }
      .toggle-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      .toolbar-title {
        font-size: 1.125rem;
        font-weight: 600;
      }
      .toolbar-spacer {
        flex: 1;
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
        .shell-sidebar {
          display: none;
        }
        .page-content {
          padding: 1rem;
          padding-bottom: 4.5rem;
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
          color: #475569;
          font-size: 0.6875rem;
        }
        .mob-icon {
          font-size: 1.25rem;
        }
        .mobile-item.active-mobile-link {
          color: #0369a1;
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
