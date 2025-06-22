import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Download,
  BarChart3,
  ArrowUp,
  Utensils,
  Pizza,
  Wand2,
  Users,
  Target,
  Award,
  ArrowRight,
  Eye,
  Heart,
  Star,
  Calendar,
  Clock,
  MapPin,
  Zap,
  DollarSign,
  Activity,
  Truck,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ShoppingBag,
  Percent
} from "lucide-react";
import { Chart } from "react-chartjs-2";
import {
  createPerformanceChartData,
  performanceChartOptions,
  aggregateAnalyticsByPlatform,
  formatCurrency,
  calculateGrowthPercentage,
  formatGrowthPercentage
} from "@/lib/charts";
import { useState } from "react";

export default function AnalyticsTab() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics", { platform: "all", days: 30 }],
  });

  const { data: platformAnalytics, isLoading: platformLoading } = useQuery({
    queryKey: ["/api/analytics", { days: 7 }],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/ai/insights", { context: "analytics" }],
  });

  // New queries for competitor analysis and trends
  const { data: competitorData, isLoading: competitorLoading } = useQuery({
    queryKey: ["/api/competitor-analysis", { location: "current", days: 30 }],
  });

  const { data: dishAnalytics, isLoading: dishLoading } = useQuery({
    queryKey: ["/api/dish-analytics", { days: 30 }],
  });

  const { data: customerAnalytics, isLoading: customerLoading } = useQuery({
    queryKey: ["/api/customer-analytics", { days: 30 }],
  });

  const { data: marketingAnalytics, isLoading: marketingLoading } = useQuery({
    queryKey: ["/api/marketing-analytics", { days: 30 }],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      // Mock report generation - in real app this would generate and download actual reports
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { reportUrl: `/reports/${reportType}-${Date.now()}.pdf` };
    },
    onSuccess: (data, reportType) => {
      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been generated successfully.`,
      });
      // In real app, this would trigger download
      console.log("Download report:", data.reportUrl);
    },
    onError: () => {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const platformIcons = {
    swiggy: Utensils,
    zomato: Pizza,
    magicpin: Wand2
  };

  const platformConfig = {
    swiggy: { name: "Swiggy", color: "bg-red-500" },
    zomato: { name: "Zomato", color: "bg-red-600" },
    magicpin: { name: "Magicpin", color: "bg-purple-500" }
  };

  // Process analytics data
  const last7Days = analytics?.slice(-7) || [];
  const chartData = createPerformanceChartData(
    last7Days.map((a: any) => ({
      date: a.date,
      revenue: parseFloat(a.revenue || '0'),
      orders: a.orders || 0,
    }))
  );

  const platformMetrics = platformAnalytics ? aggregateAnalyticsByPlatform(platformAnalytics) : [];

  // Calculate overall metrics
  const totalRevenue = platformMetrics.reduce((sum, p) => sum + p.revenue, 0);
  const totalOrders = platformMetrics.reduce((sum, p) => sum + p.orders, 0);

  // Calculate growth (mock calculation for demo)
  const previousRevenue = totalRevenue * 0.92; // Mock previous period
  const revenueGrowth = calculateGrowthPercentage(totalRevenue, previousRevenue);

  // Mock data for new sections
  const mockTopDishes = [
    { name: "Chicken Biryani", orders: 234, revenue: 46800, trend: "up", competitor_rank: 2 },
    { name: "Butter Chicken", orders: 189, revenue: 37800, trend: "up", competitor_rank: 1 },
    { name: "Paneer Tikka", orders: 156, revenue: 31200, trend: "down", competitor_rank: 3 },
    { name: "Dal Makhani", orders: 142, revenue: 21300, trend: "up", competitor_rank: 4 },
    { name: "Mutton Curry", orders: 98, revenue: 24500, trend: "stable", competitor_rank: 5 }
  ];

  // Enhanced pie chart data with better colors and styling
  const mockDishRevenueData = {
    labels: ["Chicken Biryani", "Butter Chicken", "Paneer Tikka", "Dal Makhani", "Others"],
    datasets: [{
      data: [28, 22, 18, 12, 20],
      backgroundColor: [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"
      ],
      borderColor: "#ffffff",
      borderWidth: 3,
      hoverBackgroundColor: [
        "#FF5252", "#26A69A", "#2196F3", "#66BB6A", "#FFD54F"
      ],
      hoverBorderWidth: 4,
      hoverOffset: 8
    }]
  };

  const mockCustomerData = {
    labels: ["New Customers", "Returning Customers"],
    datasets: [{
      data: [35, 65],
      backgroundColor: ["#667EEA", "#764BA2"],
      borderColor: "#ffffff",
      borderWidth: 3,
      hoverBackgroundColor: ["#5A67D8", "#553C9A"],
      hoverBorderWidth: 4,
      hoverOffset: 8
    }]
  };

  const mockMarketingCampaigns = [
    { name: "Weekend Special", performance: 85, orders: 324, revenue: 64800, roi: "240%" },
    { name: "Lunch Combo", performance: 92, orders: 456, revenue: 45600, roi: "180%" },
    { name: "Festival Offer", performance: 78, orders: 234, revenue: 58500, roi: "220%" },
    { name: "New User Discount", performance: 67, orders: 189, revenue: 28350, roi: "150%" }
  ];

  const mockCompetitorTrends = [
    { category: "North Indian", your_rank: 3, top_competitor: "Spice Garden", avg_rating: 4.2 },
    { category: "South Indian", your_rank: 7, top_competitor: "Dosa Palace", avg_rating: 4.5 },
    { category: "Chinese", your_rank: 5, top_competitor: "Dragon Bowl", avg_rating: 4.0 },
    { category: "Fast Food", your_rank: 2, top_competitor: "Quick Bites", avg_rating: 4.3 }
  ];

  // Enhanced pie chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          },
          color: '#374151'
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderJoinStyle: 'round' as const,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  };

  const mockInsights = [
    {
      type: "positive",
      title: "Peak Hours Identified",
      description: "7-9 PM shows 40% higher orders. Consider running evening promotions.",
      actionRequired: true,
      suggestedAction: "Create targeted evening offers"
    },
    {
      type: "opportunity", 
      title: "Menu Optimization",
      description: "Your \"Chicken Biryani\" has 85% positive reviews. Consider featuring it more prominently.",
      actionRequired: false,
      suggestedAction: "Update menu positioning"
    },
    {
      type: "warning",
      title: "Rating Alert", 
      description: "Recent ratings dropped by 0.2 points. Check delivery times and food quality.",
      actionRequired: true,
      suggestedAction: "Review quality processes"
    }
  ];

  const aiInsights = insights?.insights || mockInsights;

  const quickReports = [
    { id: "daily", label: "Daily Sales Report", description: "Today's performance summary" },
    { id: "weekly", label: "Weekly Performance", description: "Last 7 days analysis" },
    { id: "custom", label: "Custom Report", description: "Generate custom date range report" }
  ];

  // Additional widget data
  const operationalMetrics = {
    avgDeliveryTime: 28,
    onTimeDelivery: 89,
    avgRating: 4.3,
    totalReviews: 1247,
    peakHours: "7-9 PM",
    busiestDay: "Saturday"
  };

  const revenueBreakdown = [
    { source: "Direct Orders", amount: 125000, percentage: 45, color: "bg-blue-500" },
    { source: "Food Platforms", amount: 98000, percentage: 35, color: "bg-green-500" },
    { source: "Promotions", amount: 56000, percentage: 20, color: "bg-purple-500" }
  ];

  const customerFeedback = {
    positive: 78,
    neutral: 15,
    negative: 7,
    totalFeedback: 432,
    commonPraise: ["Great taste", "Quick delivery", "Value for money"],
    commonComplaints: ["Late delivery", "Cold food", "Packaging issues"]
  };

  if (analyticsLoading || platformLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
              <Badge variant="outline" className="flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>Live Data</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button size="sm" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Overview */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">Total Revenue:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
                  <Badge 
                    variant={revenueGrowth >= 0 ? "default" : "destructive"}
                    className={revenueGrowth >= 0 ? "bg-green-600" : ""}
                  >
                    {revenueGrowth >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {formatGrowthPercentage(revenueGrowth)}
                  </Badge>
                </div>
              </div>
              <div className="h-64">
                <Chart type="bar" data={chartData} options={performanceChartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis & Trends Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Analysis & Trends</h3>

              {/* Revenue Distribution and Customer Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                    Revenue by Dish Category
                  </h4>
                  <div className="h-56 relative">
                    <Chart type="pie" data={mockDishRevenueData} options={pieChartOptions} />
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-green-500" />
                    Customer Retention
                  </h4>
                  <div className="h-48 relative">
                    <Chart type="doughnut" data={mockCustomerData} options={pieChartOptions} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">35%</p>
                      <p className="text-sm text-gray-500">New Customers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">65%</p>
                      <p className="text-sm text-gray-500">Returning</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Campaign Performance */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-purple-500" />
                  Marketing Campaign Performance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockMarketingCampaigns.map((campaign) => (
                    <div key={campaign.name} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{campaign.name}</h5>
                        <Badge 
                          variant={campaign.performance >= 80 ? "default" : campaign.performance >= 60 ? "secondary" : "destructive"}
                          className={campaign.performance >= 80 ? "bg-green-600" : campaign.performance >= 60 ? "bg-yellow-600" : ""}
                        >
                          {campaign.performance}%
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Orders:</span>
                          <span className="font-medium">{campaign.orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue:</span>
                          <span className="font-medium">{formatCurrency(campaign.revenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ROI:</span>
                          <span className="font-medium text-green-600">{campaign.roi}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Dishes */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Award className="w-4 h-4 mr-2 text-yellow-500" />
                  Top Performing Dishes in Your Area
                </h4>
                <div className="space-y-3">
                  {mockTopDishes.map((dish, index) => (
                    <div key={dish.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{dish.name}</p>
                          <p className="text-sm text-gray-500">{dish.orders} orders • {formatCurrency(dish.revenue)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            dish.competitor_rank <= 3 ? 'border-green-300 text-green-700' : 
                            dish.competitor_rank <= 5 ? 'border-orange-300 text-orange-700' : 
                            'border-red-300 text-red-700'
                          }`}
                        >
                          #{dish.competitor_rank} in area
                        </Badge>
                        {dish.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {dish.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {dish.trend === 'stable' && <ArrowRight className="w-4 h-4 text-gray-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitor Category Rankings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-orange-500" />
                  Category Competitive Position
                </h4>
                <div className="space-y-3">
                  {mockCompetitorTrends.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Your Rank</p>
                          <p className={`text-lg font-bold ${
                            category.your_rank <= 2 ? 'text-green-600' : 
                            category.your_rank <= 4 ? 'text-orange-600' : 
                            'text-red-600'
                          }`}>
                            #{category.your_rank}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{category.category}</p>
                          <p className="text-sm text-gray-500">Top: {category.top_competitor}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{category.avg_rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Comparison</h3>
              <div className="grid grid-cols-3 gap-4">
                {platformMetrics.map((platform) => {
                  const config = platformConfig[platform.platform as keyof typeof platformConfig];
                  const Icon = platformIcons[platform.platform as keyof typeof platformIcons] || Utensils;
                  const isConnected = platform.revenue > 0;
                  
                  return (
                    <div 
                      key={platform.platform}
                      className={`
                        text-center p-4 border border-gray-200 rounded-lg
                        ${!isConnected ? "opacity-50" : ""}
                      `}
                    >
                      <div className={`w-12 h-12 ${config?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-medium text-gray-900">{config?.name || platform.platform}</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {isConnected ? formatCurrency(platform.revenue) : "₹0"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isConnected ? `${platform.orders} orders` : "Not connected"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights and Reports */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
              
              {insightsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {aiInsights.map((insight: any, index: number) => {
                    const getInsightIcon = () => {
                      switch (insight.type) {
                        case "positive":
                          return <ArrowUp className="w-4 h-4 text-green-600" />;
                        case "opportunity":
                          return <Lightbulb className="w-4 h-4 text-blue-600" />;
                        case "warning":
                          return <AlertTriangle className="w-4 h-4 text-orange-600" />;
                        default:
                          return <TrendingUp className="w-4 h-4 text-gray-600" />;
                      }
                    };

                    const getInsightBg = () => {
                      switch (insight.type) {
                        case "positive":
                          return "bg-green-50 border-green-200";
                        case "opportunity":
                          return "bg-blue-50 border-blue-200";
                        case "warning":
                          return "bg-orange-50 border-orange-200";
                        default:
                          return "bg-gray-50 border-gray-200";
                      }
                    };

                    return (
                      <div key={index} className={`p-3 rounded-lg border ${getInsightBg()}`}>
                        <div className="flex items-start space-x-2">
                          <div className="mt-1">
                            {getInsightIcon()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                            {insight.actionRequired && (
                              <Button size="sm" variant="outline" className="mt-2 text-xs h-auto py-1 px-2 whitespace-normal break-words">
                                {insight.suggestedAction}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
              
              <div className="space-y-3">
                {quickReports.map((report) => (
                  <Button
                    key={report.id}
                    variant="outline"
                    className="w-full justify-between text-left h-auto p-3"
                    onClick={() => generateReportMutation.mutate(report.id)}
                    disabled={generateReportMutation.isPending}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.label}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </Button>
                ))}
              </div>

              <Button 
                className="w-full mt-4"
                onClick={() => generateReportMutation.mutate("comprehensive")}
                disabled={generateReportMutation.isPending}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {generateReportMutation.isPending ? "Generating..." : "Generate Comprehensive Report"}
              </Button>
            </CardContent>
          </Card>

          {/* Operational Metrics Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-500" />
                Operational Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{operationalMetrics.avgDeliveryTime}m</p>
                  <p className="text-xs text-gray-600">Avg Delivery</p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{operationalMetrics.onTimeDelivery}%</p>
                  <p className="text-xs text-gray-600">On-Time Rate</p>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{operationalMetrics.avgRating}</p>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{operationalMetrics.totalReviews}</p>
                  <p className="text-xs text-gray-600">Total Reviews</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Peak Hours:</span>
                  <span className="font-semibold text-gray-900">{operationalMetrics.peakHours}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-600">Busiest Day:</span>
                  <span className="font-semibold text-gray-900">{operationalMetrics.busiestDay}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                Revenue Sources
              </h3>
              
              <div className="space-y-4">
                {revenueBreakdown.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">{source.source}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(source.amount)}</span>
                        <Badge variant="outline" className="text-xs">
                          {source.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${source.color}`}
                        style={{ width: `${source.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">Total Revenue</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(revenueBreakdown.reduce((sum, source) => sum + source.amount, 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Feedback Widget */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-orange-500" />
                Customer Feedback
              </h3>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <ThumbsUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-green-600">{customerFeedback.positive}%</p>
                  <p className="text-xs text-gray-600">Positive</p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-600">{customerFeedback.neutral}%</p>
                  <p className="text-xs text-gray-600">Neutral</p>
                </div>
                
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <ThumbsDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-red-600">{customerFeedback.negative}%</p>
                  <p className="text-xs text-gray-600">Negative</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-2">Common Praise:</p>
                  <div className="flex flex-wrap gap-1">
                    {customerFeedback.commonPraise.map((praise, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {praise}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-red-700 mb-2">Areas to Improve:</p>
                  <div className="flex flex-wrap gap-1">
                    {customerFeedback.commonComplaints.map((complaint, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-red-100 text-red-700">
                        {complaint}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Feedback:</span>
                  <span className="font-semibold text-gray-900">{customerFeedback.totalFeedback} responses</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Goals Widget */}
          {/* <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                Performance Goals
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Monthly Revenue Target</span>
                    <span className="text-sm font-bold text-gray-900">₹3,50,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">₹2,52,000 achieved</span>
                    <span className="text-xs font-medium text-gray-700">72%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Customer Satisfaction</span>
                    <span className="text-sm font-bold text-gray-900">4.5★</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: '86%' }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Current: 4.3★</span>
                    <span className="text-xs font-medium text-gray-700">86%</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">Order Volume</span>
                    <span className="text-sm font-bold text-gray-900">2,000 orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">1,300 orders this month</span>
                    <span className="text-xs font-medium text-gray-700">65%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Location Performance Widget */}
          {/* <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-500" />
                Location Insights
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Top Delivery Area</span>
                    <Badge className="bg-blue-600">Koramangala</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">28% of total orders</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Fastest Growing Area</span>
                    <Badge className="bg-green-600">HSR Layout</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">+45% growth this month</p>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Peak Delivery Time</span>
                    <Badge className="bg-orange-600">7:30 PM</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Average: 25 minutes</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                View Delivery Heatmap
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  )};