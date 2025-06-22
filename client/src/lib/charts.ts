import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
  platform?: string;
}

export interface PlatformMetrics {
  platform: string;
  revenue: number;
  orders: number;
  color: string;
}

export const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString()}`;
};

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const dateObj = new Date(date);
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('en', { weekday: 'short' });
  }
  
  return dateObj.toLocaleDateString('en', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export const createPerformanceChartData = (analytics: ChartDataPoint[]) => {
  const labels = analytics.map(a => formatDate(a.date));
  
  return {
    labels,
    datasets: [
      {
        label: 'Orders',
        data: analytics.map(a => a.orders),
        backgroundColor: 'hsl(207, 90%, 54%)',
        borderColor: 'hsl(207, 90%, 54%)',
        type: 'bar' as const,
        yAxisID: 'y',
      },
      {
        label: 'Revenue',
        data: analytics.map(a => a.revenue),
        backgroundColor: 'hsl(122, 43%, 28%)',
        borderColor: 'hsl(122, 43%, 28%)',
        type: 'line' as const,
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  };
};

export const createRevenueChartData = (analytics: ChartDataPoint[]) => {
  return {
    labels: analytics.map(a => formatDate(a.date)),
    datasets: [
      {
        label: 'Revenue',
        data: analytics.map(a => a.revenue),
        borderColor: 'hsl(207, 90%, 54%)',
        backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
};

export const performanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          
          if (label === 'Revenue') {
            return `${label}: ${formatCurrency(value)}`;
          }
          
          return `${label}: ${value}`;
        },
      },
    },
  },
  scales: {
    x: {
      type: 'category' as const,
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Orders',
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Revenue (₹)',
      },
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: function(value: any) {
          return formatCurrency(value);
        },
      },
    },
  },
};

export const revenueChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `Revenue: ${formatCurrency(context.parsed.y)}`;
        },
      },
    },
  },
  scales: {
    x: {
      type: 'category' as const,
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: any) {
          return formatCurrency(value);
        },
      },
    },
  },
};

export const aggregateAnalyticsByPlatform = (analytics: any[]): PlatformMetrics[] => {
  const platformColors = {
    swiggy: 'hsl(0, 87%, 48%)',
    zomato: 'hsl(0, 72%, 44%)', 
    magicpin: 'hsl(270, 95%, 44%)',
  };

  const platformData = analytics.reduce((acc, item) => {
    if (item.platform && item.platform !== 'all') {
      if (!acc[item.platform]) {
        acc[item.platform] = {
          platform: item.platform,
          revenue: 0,
          orders: 0,
          color: platformColors[item.platform as keyof typeof platformColors] || 'hsl(0, 0%, 50%)',
        };
      }
      
      acc[item.platform].revenue += parseFloat(item.revenue || '0');
      acc[item.platform].orders += item.orders || 0;
    }
    
    return acc;
  }, {} as Record<string, PlatformMetrics>);

  return Object.values(platformData);
};

export const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const formatGrowthPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};
