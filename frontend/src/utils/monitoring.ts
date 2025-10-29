// Sistema de monitoreo y analytics para producción

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: number;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class MonitoringService {
  private isProduction = import.meta.env.PROD;
  private apiUrl = import.meta.env.VITE_API_URL;
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];

  constructor() {
    if (this.isProduction) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitorear errores globales
    window.addEventListener('error', (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        severity: 'high'
      });
    });

    // Monitorear promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        severity: 'medium'
      });
    });

    // Monitorear performance
    this.monitorPerformance();
  }

  private monitorPerformance() {
    // Web Vitals
    if ('web-vital' in window) {
      // @ts-ignore
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.onPerfEntry);
        getFID(this.onPerfEntry);
        getFCP(this.onPerfEntry);
        getLCP(this.onPerfEntry);
        getTTFB(this.onPerfEntry);
      });
    }

    // Navigation Timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.recordMetric('first_paint', this.getFirstPaint());
      }, 0);
    });
  }

  private onPerfEntry = (metric: any) => {
    this.recordMetric(metric.name, metric.value);
  };

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  public recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.push(metric);

    // Enviar métricas críticas inmediatamente
    if (this.isCriticalMetric(name, value)) {
      this.sendMetrics([metric]);
    }

    // Limpiar métricas antiguas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  public reportError(error: ErrorReport) {
    this.errors.push(error);

    // Log en desarrollo
    if (!this.isProduction) {
      console.error('Error reportado:', error);
    }

    // Enviar errores críticos inmediatamente
    if (error.severity === 'critical' || error.severity === 'high') {
      this.sendErrors([error]);
    }

    // Limpiar errores antiguos
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-25);
    }
  }

  private isCriticalMetric(name: string, value: number): boolean {
    const criticalThresholds = {
      'LCP': 4000, // Largest Contentful Paint > 4s
      'FID': 300,  // First Input Delay > 300ms
      'CLS': 0.25, // Cumulative Layout Shift > 0.25
      'page_load_time': 10000 // Page load > 10s
    };

    return name in criticalThresholds && value > criticalThresholds[name as keyof typeof criticalThresholds];
  }

  private async sendMetrics(metrics: PerformanceMetric[]) {
    if (!this.isProduction) return;

    try {
      await fetch(`${this.apiUrl}/monitoring/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics })
      });
    } catch (error) {
      console.warn('Failed to send metrics:', error);
    }
  }

  private async sendErrors(errors: ErrorReport[]) {
    if (!this.isProduction) return;

    try {
      await fetch(`${this.apiUrl}/monitoring/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      console.warn('Failed to send errors:', error);
    }
  }

  // Enviar métricas pendientes antes de cerrar la página
  public flush() {
    if (this.metrics.length > 0) {
      navigator.sendBeacon(
        `${this.apiUrl}/monitoring/metrics`,
        JSON.stringify({ metrics: this.metrics })
      );
    }

    if (this.errors.length > 0) {
      navigator.sendBeacon(
        `${this.apiUrl}/monitoring/errors`,
        JSON.stringify({ errors: this.errors })
      );
    }
  }

  // Métricas personalizadas
  public trackUserAction(action: string, details?: any) {
    this.recordMetric(`user_action_${action}`, 1);
    
    if (!this.isProduction) {
      console.log(`User action: ${action}`, details);
    }
  }

  public trackApiCall(endpoint: string, duration: number, status: number) {
    this.recordMetric(`api_call_duration`, duration);
    this.recordMetric(`api_call_${status >= 400 ? 'error' : 'success'}`, 1);

    if (status >= 400) {
      this.reportError({
        message: `API Error: ${endpoint} returned ${status}`,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        severity: status >= 500 ? 'high' : 'medium'
      });
    }
  }
}

// Instancia global del servicio de monitoreo
export const monitoring = new MonitoringService();

// Limpiar antes de cerrar la página
window.addEventListener('beforeunload', () => {
  monitoring.flush();
});

// Hook para React components
export const useMonitoring = () => {
  return {
    recordMetric: monitoring.recordMetric.bind(monitoring),
    reportError: monitoring.reportError.bind(monitoring),
    trackUserAction: monitoring.trackUserAction.bind(monitoring),
    trackApiCall: monitoring.trackApiCall.bind(monitoring),
  };
};