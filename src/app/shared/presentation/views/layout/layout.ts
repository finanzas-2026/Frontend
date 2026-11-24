import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Toolbar } from '../../components/toolbar/toolbar';
import { MobileNavigation } from '../../components/mobile-navigation/mobile-navigation';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Toolbar, MobileNavigation],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  host: { '(keydown.escape)': 'closeMobileSidebar()' },
})
export class Layout {
  protected readonly isMobile = toSignal(
    inject(BreakpointObserver).observe('(max-width: 768px)'),
  );
  private readonly desktopOpen = signal(true);
  private readonly mobileOpen = signal(false);
  readonly isSidebarOpen = computed(() =>
    this.isMobile()?.matches ? this.mobileOpen() : this.desktopOpen(),
  );

  constructor() {
    inject(Router).events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.closeMobileSidebar();
    });
  }

  toggleSidebar(): void {
    const open = this.isMobile()?.matches ? this.mobileOpen : this.desktopOpen;
    open.update((value) => !value);
  }

  closeMobileSidebar(): void {
    this.mobileOpen.set(false);
  }
}
