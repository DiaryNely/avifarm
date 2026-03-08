import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { tap } from 'rxjs';

export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const side = isPlatformBrowser(platformId) ? '🌐 BROWSER' : '🖥️ SERVER';
  const start = Date.now();

  console.log(`[${side}] ▶ ${req.method} ${req.url}`);

  return next(req).pipe(
    tap({
      next: () => {
        console.log(`[${side}] ✅ ${req.method} ${req.url} (${Date.now() - start}ms)`);
      },
      error: (err) => {
        console.error(`[${side}] ❌ ${req.method} ${req.url} (${Date.now() - start}ms)`, err.status, err.message);
      },
    })
  );
};
