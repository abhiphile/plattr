import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { TabType } from "@/pages/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuickActions from "@/components/QuickActions";
import AlertMonitor from "@/components/AlertMonitor";
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Star, 
  Megaphone,
  IndianRupee,
  Clock,
  Rocket,
  BarChart3,
  Tag,
  Pizza,
  Utensils,
  Wand2,
  Zap,
  Calendar
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardTabProps {
  onTabChange: (tab: TabType) => void;
}

// Enhanced Revenue Chart Component
interface RevenueChartProps {
  analytics: any[];
}

function RevenueChart({ analytics }: RevenueChartProps) {
  const [selectedRange, setSelectedRange] = useState('7');

  const timeRangeOptions = [
    { value: '7', label: '7D', fullLabel: '7 Days' },
    { value: '14', label: '14D', fullLabel: '14 Days' },
    { value: '30', label: '30D', fullLabel: '30 Days' },
    { value: '90', label: '90D', fullLabel: '90 Days' }
  ];

  const chartData = useMemo(() => {
    const days = parseInt(selectedRange);
    const data = analytics?.slice(-days) || [];
    
    return {
      labels: data.map((a: any) => {
        const date = new Date(a.date);
        if (days <= 7) {
          return date.toLocaleDateString('en', { weekday: 'short' });
        } else if (days <= 14) {
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        } else {
          return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
        }
      }),
      datasets: [
        {
          label: 'Revenue',
          data: data.map((a: any) => parseFloat(a.revenue || "0")),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#1d4ed8',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [analytics, selectedRange]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 20,
          font: {
            size: 12,
            weight: '600' as const
          },
          color: '#374151',
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#2563eb',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
        padding: 12,
        titleFont: {
          size: 13,
          weight: '600' as const
        },
        bodyFont: {
          size: 12,
          weight: '500' as const
        },
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const days = parseInt(selectedRange);
            const data = analytics?.slice(-days) || [];
            const date = new Date(data[dataIndex]?.date);
            return date.toLocaleDateString('en', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          },
          label: function(context: any) {
            return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500' as const
          },
          maxRotation: 0,
          padding: 8
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500' as const
          },
          padding: 8,
          callback: function(value: any) {
            return '₹' + value.toLocaleString();
          }
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      }
    }
  }), [analytics, selectedRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const days = parseInt(selectedRange);
    const data = analytics?.slice(-days) || [];
    
    if (data.length === 0) return null;
    
    const revenues = data.map((a: any) => parseFloat(a.revenue || "0"));
    const total = revenues.reduce((sum, rev) => sum + rev, 0);
    const average = total / revenues.length;
    const max = Math.max(...revenues);
    
    // Calculate trend (comparing first half vs second half)
    const halfPoint = Math.floor(revenues.length / 2);
    const firstHalf = revenues.slice(0, halfPoint);
    const secondHalf = revenues.slice(halfPoint);
    const firstHalfAvg = firstHalf.reduce((sum, rev) => sum + rev, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, rev) => sum + rev, 0) / secondHalf.length;
    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    return {
      total,
      average,
      max,
      trendPercentage,
      isPositiveTrend: trendPercentage > 0
    };
  }, [analytics, selectedRange]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-6 pb-4 bg-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Revenue Trend
              </h3>
              <p className="text-sm text-gray-600">
                Track your revenue performance over the last {timeRangeOptions.find(opt => opt.value === selectedRange)?.fullLabel.toLowerCase()}
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedRange === option.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedRange(option.value)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                    ${selectedRange === option.value 
                      ? 'bg-white shadow-sm text-blue-600 border border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }
                  `}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">₹{stats.total.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average</p>
                <p className="text-lg font-bold text-gray-900">₹{Math.round(stats.average).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Peak Day</p>
                <p className="text-lg font-bold text-gray-900">₹{stats.max.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trend</p>
                <div className="flex items-center gap-1">
                  {stats.isPositiveTrend ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <p className={`text-lg font-bold ${stats.isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.isPositiveTrend ? '+' : ''}{stats.trendPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="p-6 pt-4">
          <div className="h-64 sm:h-80 relative">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleDateString('en', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              <span>All amounts in INR</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Dashboard Component
export default function DashboardTab({ onTabChange }: DashboardTabProps) {
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics", { platform: "all", days: 7 }],
  });

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns", { active: true }],
  });

  // Calculate metrics from analytics data
  const todayAnalytics = analytics?.find((a: any) => {
    const today = new Date().toDateString();
    return new Date(a.date).toDateString() === today;
  });

  const quickActions = [
    {
      icon: Tag,
      label: "Create Offer",
      onClick: () => onTabChange("offers")
    },
    {
      icon: Clock,
      label: "Update Timings",
      onClick: () => onTabChange("settings")
    },
    {
      icon: Rocket,
      label: "Run Campaign",
      onClick: () => onTabChange("promotions")
    },
    {
      icon: BarChart3,
      label: "View Analytics",
      onClick: () => onTabChange("analytics")
    }
  ];

  const platformIcons = {
    swiggy: Utensils,
    zomato: Pizza,
    magicpin: Wand2
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="metric-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{todayAnalytics?.revenue ? parseFloat(todayAnalytics.revenue).toLocaleString() : "12,450"}
                </p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.2%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {todayAnalytics?.orders || 47}
                </p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.3%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {todayAnalytics?.rating || "4.6"}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Based on {todayAnalytics?.reviews || 124} reviews</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {campaigns?.length || 3}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {campaigns?.filter((c: any) => c.status === "scheduled").length || 2} ending soon
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-4 h-4 sm:w-6 sm:h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Monitor */}
      <div className="lg:hidden">
        <AlertMonitor />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Charts and Quick Actions */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Enhanced Revenue Chart */}
          <RevenueChart analytics={analytics || []} />

          {/* Platform Status */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h3>
              <div className="space-y-3 sm:space-y-4">
                {platforms?.map((platform: any) => {
                  const IconComponent = platformIcons[platform.name as keyof typeof platformIcons] || Utensils;
                  const isConnected = platform.isConnected;
                  
                  return (
                    <div 
                      key={platform.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg
                        ${isConnected ? "platform-connected" : "platform-disconnected"}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-8 h-8 rounded flex items-center justify-center
                          ${platform.name === 'swiggy' ? 'bg-red-500' : 
                            platform.name === 'zomato' ? 'bg-red-600' : 'bg-purple-500'}
                        `}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900 capitalize">
                          {platform.name}
                        </span>
                      </div>
                      <Badge 
                        variant={isConnected ? "default" : "destructive"}
                        className={isConnected ? "bg-green-600" : ""}
                      >
                        {isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="quick-action-btn h-auto flex-col space-y-2 py-4 sm:py-6"
                      onClick={action.onClick}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Alert Monitor and Quick Actions */}
        <div className="space-y-6">
          <div className="hidden lg:block">
            <AlertMonitor />
          </div>
          <QuickActions platforms={platforms || []} merchant={null} />
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <button className="floating-fab lg:hidden">
        <Zap className="w-6 h-6" />
      </button>
    </div>
  );
}
