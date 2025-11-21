/**
 * Performance Monitoring Utility
 * Tracks and reports Web Vitals and custom performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Start timing a custom operation
   */
  startTimer(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        rating: this.getRating(name, duration)
      });
    };
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Log in development
    if (import.meta.env.DEV) {
      const ratingEmoji = metric.rating === 'good' ? '✅' :
                         metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${ratingEmoji} ${metric.name}: ${metric.value.toFixed(2)}ms`);
    }

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get performance rating based on metric name and value
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Custom thresholds for different operations
    const thresholds = {
      'product-query': { good: 500, poor: 1500 },
      'image-load': { good: 1000, poor: 2500 },
      'price-calculation': { good: 300, poor: 800 },
      'page-load': { good: 2000, poor: 4000 },
      'default': { good: 1000, poor: 3000 }
    };

    const threshold = thresholds[name as keyof typeof thresholds] || thresholds.default;

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get average time for a specific metric
   */
  getAverageTime(name: string): number {
    const relevant = this.metrics.filter(m => m.name === name);
    if (relevant.length === 0) return 0;

    const sum = relevant.reduce((acc, m) => acc + m.value, 0);
    return sum / relevant.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Report performance summary
   */
  report(): void {
    if (!this.enabled || this.metrics.length === 0) return;

    const summary = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { count: 0, total: 0, min: Infinity, max: -Infinity };
      }
      acc[metric.name].count++;
      acc[metric.name].total += metric.value;
      acc[metric.name].min = Math.min(acc[metric.name].min, metric.value);
      acc[metric.name].max = Math.max(acc[metric.name].max, metric.value);
      return acc;
    }, {} as Record<string, { count: number; total: number; min: number; max: number }>);

    console.group('📊 Performance Summary');
    Object.entries(summary).forEach(([name, stats]) => {
      const avg = stats.total / stats.count;
      console.log(`${name}:`, {
        avg: `${avg.toFixed(2)}ms`,
        min: `${stats.min.toFixed(2)}ms`,
        max: `${stats.max.toFixed(2)}ms`,
        count: stats.count
      });
    });
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expose to window for debugging in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}
