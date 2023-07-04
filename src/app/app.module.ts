import { NgModule } from '@angular/core';
import { tuiSvgOptionsProvider, TUI_SANITIZER } from '@taiga-ui/core';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';

import { ALL_TAIGA_UI_MODULES } from './@stackblitz/all-taiga-modules';
import { AppComponent } from './app.component';
import { ComComponent } from './com/com.component';
import { TreeViewComponent } from './tree/tree-view.component';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@NgModule({
  /**
   * Don't use this approach,
   * it's a workaround for stackblitz
   */
  imports: [BrowserModule, CommonModule, FormsModule],
  declarations: [AppComponent, ComComponent, TreeViewComponent],
  bootstrap: [AppComponent],
  providers: [
    // A workaround because StackBlitz does not support assets
    tuiSvgOptionsProvider({
      path: 'https://taiga-ui.dev/assets/taiga-ui/icons',
    }),
    /**
     * If you use unsafe icons or TuiEditor in your app
     *
     * Take a look at: https://github.com/tinkoff/ng-dompurify
     *
     * This library implements DOMPurify as Angular Sanitizer or Pipe.
     * It delegates sanitizing to DOMPurify and supports the same configuration.
     */
    {
      provide: TUI_SANITIZER,
      useClass: NgDompurifySanitizer,
    },
  ],
})
export class AppModule {}
