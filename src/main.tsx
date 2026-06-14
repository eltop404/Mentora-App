import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App.tsx';
import './index.css';
import { setupRealtimeSync, pullSiteData } from './services/realtimeSync';

// ─── Init Realtime after Supabase is ready ──────────────────────
window.addEventListener('nt-supabase-ready', () => {
  pullSiteData();        // سحب البيانات من السحابة فور الاتصال
  setupRealtimeSync();   // تفعيل الاستماع اللحظي
}, { once: true });

// --- PRODUCTION STABILIZATION ENGINE ---
const APP_VERSION = "2.1.0";

// ⚡ PERFORMANCE: Defer all cleanup operations off the main thread.
// SW unregistration and cache deletion were previously blocking the critical render path.
// They are now scheduled after React has mounted and painted the first frame.
const deferredCleanup = () => {
  // 1. Unregister ALL service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  }

  // 2. Clear all browser caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
};

// Run cleanup after first idle moment (not blocking render)
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(deferredCleanup, { timeout: 3000 });
} else {
  setTimeout(deferredCleanup, 1000);
}

// 3. Version sync — surgical clear (keep sessions, purge stale data)
// ⚡ This must run synchronously to prevent stale data, but is fast (just localStorage reads/writes)
try {
  const savedVersion = localStorage.getItem("nt_app_version");
  if (savedVersion !== APP_VERSION) {
    const keysToKeep = [
      'nt_current_user', 'nt_is_admin', 'session', 'nt_app_version',
      'nt_app_settings', 'nt_site_texts', 'nt_theme', 'nt_cert_name',
    ];
    const items: Record<string, string> = {};
    keysToKeep.forEach(k => {
      const val = localStorage.getItem(k);
      if (val) items[k] = val;
    });
    localStorage.clear();
    sessionStorage.clear();
    Object.keys(items).forEach(k => localStorage.setItem(k, items[k]));
    localStorage.setItem("nt_app_version", APP_VERSION);
  }
} catch (e) {
  console.error("[App] Version sync failed:", e);
}

// 4. Global Error Protection
window.onerror = function (msg, url, line) {
  console.error(`GLOBAL ERROR: ${msg} at ${url}:${line}`);
};

// 5. React Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMessage: error?.message || 'خطأ غير معروف'
    };
  }

  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary] React Error Caught:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleRepair = () => {
    try {
      // Keep user session before clearing
      const userBackup = localStorage.getItem('nt_current_user');
      const adminBackup = localStorage.getItem('nt_is_admin');
      const themeBackup = localStorage.getItem('nt_theme');

      localStorage.clear();
      sessionStorage.clear();

      // Restore session
      if (userBackup) localStorage.setItem('nt_current_user', userBackup);
      if (adminBackup) localStorage.setItem('nt_is_admin', adminBackup);
      if (themeBackup) localStorage.setItem('nt_theme', themeBackup);
    } catch (e) {
      // If localStorage fails, just reload
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          color: 'white',
          fontFamily: 'Cairo, Tajawal, sans-serif',
          textAlign: 'center',
          padding: '20px',
          direction: 'rtl'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <span style={{ fontSize: '36px' }}>⚠️</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '8px' }}>
            يرجى الضغط على "إعادة المحاولة" أولاً
          </p>
          <p style={{ opacity: 0.4, fontSize: '12px', marginBottom: '30px', maxWidth: '300px' }}>
            {this.state.errorMessage}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 28px',
                backgroundColor: '#06b6d4',
                border: 'none',
                borderRadius: '12px',
                color: 'black',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '15px'
              }}
            >
              إعادة المحاولة
            </button>
            <button
              onClick={this.handleRepair}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            >
              إصلاح شامل (مسح الكاش)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- INITIALIZATION ---
const rootEl = document.getElementById('root')!;
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
);

// Hide the native HTML loader once React has taken over
requestAnimationFrame(() => {
  setTimeout(() => {
    const loader = document.getElementById('app-native-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => loader.remove(), 400);
    }
  }, 300);
});
