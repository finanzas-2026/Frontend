import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Toolbar } from '../../components/toolbar/toolbar';
import { MobileNavigation } from '../../components/mobile-navigation/mobile-navigation';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Toolbar, MobileNavigation],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  readonly isSidebarOpen = signal<boolean>(true);

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }
}
