import OpenAI from "openai";
import { browserService } from "./browser";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface AIAssistantOptions {
  context: "offers" | "promotions" | "settings" | "analytics" | "general";
  merchantData?: any;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  platformData?: any;
}

export interface AIResponse {
  message: string;
  actionRequired?: boolean;
  suggestedActions?: Array<{
    type: string;
    description: string;
    data?: any;
  }>;
  data?: any;
  browserTaskId?: string;
  needsRealTimeData?: boolean;
}

export interface DataExtractionRequest {
  platforms: string[];
  dataTypes: string[];
  timeframe?: string;
  filters?: any;
}

export class AIAssistant {
  private pendingDataRequests: Map<string, DataExtractionRequest> = new Map();

  // Fixed platform URLs for dashboard access
  private readonly PLATFORM_URLS = {
    'swiggy': 'https://partner.swiggy.com/dashboard',
    'zomato': 'https://www.zomato.com/partner/dashboard',
    'magicpin': 'https://magicpin.in/partners/dashboard'
  };

  async processMessage(userMessage: string, options: AIAssistantOptions): Promise<AIResponse> {
    try {

      // First, analyze if the message requires real-time data
      const dataRequirement = await this.analyzeDataRequirement(userMessage, options.context);
      // Store conversation message
      await this.storeConversationMessage(dataRequirement.merchantId || 1, options.context, userMessage, 'user');
      
      if (dataRequirement.needsRealTimeData) {
        // Check what platforms are connected
        const platforms = await storage.getPlatformsByMerchant(dataRequirement.merchantId || 1);
        const connectedPlatforms = platforms.filter(p => p.isConnected);
        
        if (connectedPlatforms.length === 0) {
          const response = {
            message: "I'd love to help you with real-time data, but you don't have any platforms connected yet. Please connect your platforms (Swiggy, Zomato, or Magicpin) first to get live insights about your business performance.",
            actionRequired: true,
            suggestedActions: [{
              type: "connect_platforms",
              description: "Connect your delivery platforms to get real-time data",
              data: { platforms: ["swiggy", "zomato", "magicpin"] }
            }]
          };
          
          // Store assistant response
          await this.storeConversationMessage(dataRequirement.merchantId || 1, options.context, response.message, 'assistant');
          return response;
        }

        // Filter requested platforms to only include connected ones
        const availableConnectedPlatforms = dataRequirement.platforms.filter(platform => 
          connectedPlatforms.some(cp => cp.name.toLowerCase() === platform.toLowerCase())
        );

        if (availableConnectedPlatforms.length === 0) {
          const connectedPlatformNames = connectedPlatforms.map(p => p.name).join(', ');
          const response = {
            message: `I can help you with real-time data from your connected platforms: ${connectedPlatformNames}. However, the specific platforms you mentioned aren't connected yet. Would you like me to fetch data from your connected platforms instead?`,
            actionRequired: false,
            data: { connectedPlatforms: connectedPlatformNames }
          };
          
          // Store assistant response
          await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
          return response;
        }

        // Extract data using browser automation only from connected platforms
        const browserTaskId = await this.extractRealTimeData(
          options.merchantId,
          { ...dataRequirement, platforms: availableConnectedPlatforms }
        );

        if (browserTaskId === "no_connected_platforms") {
          const response = {
            message: "No connected platforms are available for the requested data.",
            actionRequired: true,
            suggestedActions: [{
              type: "connect_platforms",
              description: "Connect your delivery platforms to get real-time data"
            }]
          };
          
          // Store assistant response
          await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
          return response;
        }

        const platformList = availableConnectedPlatforms.join(', ');
        const response = {
          message: `I'm fetching the latest data from ${platformList}. This will take a moment...`,
          browserTaskId,
          needsRealTimeData: true,
          actionRequired: false
        };
        
        return response; // Don't store this intermediate message
      }

      // Process normally with available data
      const response = await this.processWithAvailableData(userMessage, options);
      
      // Store assistant response
      await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
      
      return response;

    } catch (error) {
      console.error("AI processing error:", error);
      const response = {
        message: "I'm experiencing some technical difficulties. Please try again or contact support if the issue persists.",
        actionRequired: false
      };
      
      // Store error response
      await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
      
      return response;
    }
  }

  async processWithRealTimeData(userMessage: string, options: AIAssistantOptions, browserTaskId: string): Promise<AIResponse> {
    try {
      // Get the browser task result
      const task = browserService.getTask(browserTaskId);
      
      if (!task || task.status !== 'completed') {
        return {
          message: "I'm still gathering data from your platforms. Please wait a moment and try again.",
          actionRequired: false
        };
      }

      // Parse the real-time data
      const realTimeData = this.parseRealTimeData(task.result);
      
      // Update options with real-time data
      const enhancedOptions = {
        ...options,
        platformData: realTimeData
      };

      const response = await this.processWithAvailableData(userMessage, enhancedOptions);
      
      // Store the final response with real-time data
      await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
      
      return response;

    } catch (error) {
      console.error("Real-time data processing error:", error);
      const response = {
        message: "I encountered an issue processing the latest data. Let me help you with the information I have available.",
        actionRequired: false
      };
      
      // Store error response
      await this.storeConversationMessage(options.merchantId, options.context, response.message, 'assistant');
      
      return response;
    }
  }

  private async analyzeDataRequirement(userMessage: string, context: string): Promise<{
    needsRealTimeData: boolean;
    platforms: string[];
    dataTypes: string[];
    merchantId?: number;
    timeframe?: string;
  }> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Keywords that indicate need for real-time data
    const realTimeKeywords = [
      'current', 'latest', 'today', 'now', 'recent', 'live',
      'orders', 'sales', 'revenue', 'rating', 'reviews',
      'performance', 'status', 'dashboard', 'analytics',
      'views', 'total', 'count', 'number of'
    ];
  
    // Platform keywords
    const platformKeywords = {
      swiggy: ['swiggy', 'swigy'],
      zomato: ['zomato'],
      magicpin: ['magicpin', 'magic pin', 'magic-pin']
    };
  
    // Data type keywords
    const dataTypeKeywords = {
      orders: ['orders', 'order', 'sales', 'revenue'],
      ratings: ['rating', 'ratings', 'reviews', 'feedback'],
      menu: ['menu', 'items', 'dishes', 'availability'],
      analytics: ['analytics', 'performance', 'metrics', 'insights'],
      dashboard: ['dashboard', 'overview', 'summary'],
      views: ['views', 'view', 'visits', 'visitors']
    };
  
    const needsRealTimeData = realTimeKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
  
    const requestedPlatforms: string[] = [];
    Object.entries(platformKeywords).forEach(([platform, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        requestedPlatforms.push(platform);
      }
    });
  
    const dataTypes: string[] = [];
    Object.entries(dataTypeKeywords).forEach(([dataType, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        dataTypes.push(dataType);
      }
    });
  
    // Get connected platforms from storage
    const allPlatforms = await storage.getPlatformsByMerchant(1);
    console.log('All platforms from storage:', allPlatforms); // Debug log
    
    const connectedPlatforms = allPlatforms
      .filter(p => {
        console.log(`Platform ${p.name}: isConnected=${p.isConnected}, status=${p.status}`); // Debug log
        return p.isConnected === true && p.status === 'connected';
      })
      .map(p => p.name.toLowerCase());
  
    console.log('Connected platforms:', connectedPlatforms); // Debug log
  
    // If specific platforms were requested, only include those that are connected
    let finalPlatforms: string[] = [];
    if (requestedPlatforms.length > 0) {
      finalPlatforms = requestedPlatforms.filter(platform => 
        connectedPlatforms.includes(platform.toLowerCase())
      );
    } else if (needsRealTimeData) {
      // If no specific platforms mentioned but real-time data needed, use all connected
      finalPlatforms = connectedPlatforms;
    }
  
    console.log('Final platforms for data extraction:', finalPlatforms); // Debug log
  
    // If no specific data types mentioned, default based on context
    if (dataTypes.length === 0 && needsRealTimeData) {
      switch (context) {
        case 'analytics':
          dataTypes.push('analytics', 'orders', 'views');
          break;
        case 'offers':
          dataTypes.push('dashboard', 'orders');
          break;
        default:
          dataTypes.push('dashboard');
      }
    }
  
    return {
      needsRealTimeData,
      platforms: finalPlatforms,
      dataTypes,
      merchantId: 1,
      timeframe: 'today'
    };
  }

  private async extractRealTimeData(merchantId: number, requirement: DataExtractionRequest): Promise<string> {
    // requirement.platforms already contains only connected platforms from analyzeDataRequirement
    if (requirement.platforms.length === 0) {
      console.log("No connected platforms available for the requested data");
      return "no_connected_platforms";
    }
  
    // Build comprehensive data extraction task with fixed URLs
    const taskDescription = this.buildDataExtractionTaskWithFixedUrls(requirement);
    
    // Execute browser automation only for connected platforms
    return await browserService.executeTask(taskDescription, {
      merchantId,
      platforms: requirement.platforms, // These are already filtered to connected only
      dataTypes: requirement.dataTypes,
      action: 'extract_comprehensive_data'
    });
  }

  private buildDataExtractionTaskWithFixedUrls(requirement: DataExtractionRequest): string {
    const { platforms, dataTypes, timeframe } = requirement;
    
    if (platforms.length === 0) {
      return "No platforms specified for data extraction";
    }
    
    let task = `Extract comprehensive business data from the following connected platforms using their fixed dashboard URLs:\n`;
    
    // Add specific URLs for each platform
    platforms.forEach(platform => {
      const url = this.PLATFORM_URLS[platform.toLowerCase()];
      if (url) {
        task += `- ${platform}: Navigate to ${url}\n`;
      }
    });
    
    task += `\nFor each platform dashboard, collect the following data:\n`;
    
    if (dataTypes.includes('views') || dataTypes.includes('analytics') || dataTypes.includes('dashboard')) {
      task += `- Total views/visits from all tabs and sections\n`;
      task += `- Page view statistics and metrics\n`;
      task += `- Visitor engagement data\n`;
    }
    
    if (dataTypes.includes('orders') || dataTypes.includes('analytics')) {
      task += `- Current order volume and trends for ${timeframe || 'today'}\n`;
      task += `- Revenue figures and transaction data\n`;
      task += `- Average order value and performance metrics\n`;
      task += `- Peak hours and delivery performance\n`;
    }
  
    if (dataTypes.includes('ratings')) {
      task += `- Current overall rating for each platform\n`;
      task += `- Recent rating trends and changes\n`;
      task += `- Customer review highlights and feedback\n`;
    }
  
    if (dataTypes.includes('menu')) {
      task += `- Menu item availability status\n`;
      task += `- Popular items and categories\n`;
      task += `- Out of stock items\n`;
      task += `- Pricing information\n`;
    }
  
    task += `\nDetailed Instructions:\n`;
    platforms.forEach(platform => {
      const url = this.PLATFORM_URLS[platform.toLowerCase()];
      if (url) {
        task += `
For ${platform.toUpperCase()}:
1. Navigate directly to ${url}
2. Wait for the dashboard to fully load
3. Check all available tabs and sections for data
4. Extract views/visits numbers from all visible sections
5. Collect performance metrics and KPIs
6. Navigate through different dashboard sections if needed
7. Capture any alerts, notifications, or issues
8. Return structured data with specific numbers and metrics
        `;
      }
    });
    
    task += `\nReturn data in a structured JSON format with:
- Platform name
- Specific URLs accessed
- View counts and metrics found
- Data extraction timestamp
- Any errors or issues encountered
    
Only access the specified dashboard URLs. Do not search for or navigate to other URLs.`;
  
    return task;
  }

  private async storeConversationMessage(
    merchantId: number, 
    context: string, 
    content: string, 
    role: 'user' | 'assistant'
  ): Promise<void> {
    try {
      // Get or create conversation
      let conversation = await storage.getConversation(merchantId, context);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          merchantId,
          context,
          messages: []
        });
      }

      // Add new message to conversation
      const messages = conversation.messages || [];
      messages.push({
        role,
        content,
        timestamp: new Date().toISOString()
      });

      // Update conversation with new message
      await storage.updateConversation(conversation.id, {
        messages,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error("Error storing conversation message:", error);
      // Don't throw error - conversation storage is not critical for AI functionality
    }
  }

  async getConversationHistory(merchantId: number, context: string): Promise<Array<{ role: "user" | "assistant"; content: string; timestamp: string }>> {
    try {
      const conversation = await storage.getConversation(merchantId, context);
      return conversation?.messages || [];
    } catch (error) {
      console.error("Error retrieving conversation history:", error);
      return [];
    }
  }

  // Rest of the methods remain the same...
  private parseRealTimeData(browserResult: any): any {
    try {
      if (!browserResult) return null;

      // Parse browser automation result
      let parsedData = browserResult;
      
      if (typeof browserResult === 'string') {
        try {
          parsedData = JSON.parse(browserResult);
        } catch {
          // If not JSON, treat as text result
          parsedData = { rawData: browserResult };
        }
      }

      // Structure the data for AI processing
      return {
        timestamp: new Date().toISOString(),
        source: 'browser_automation',
        platforms: parsedData.platforms || {},
        summary: parsedData.summary || {},
        alerts: parsedData.alerts || [],
        metrics: parsedData.metrics || {},
        views: parsedData.views || {},
        rawData: parsedData
      };

    } catch (error) {
      console.error("Error parsing real-time data:", error);
      return { error: "Failed to parse real-time data", rawData: browserResult };
    }
  }

  private async processWithAvailableData(userMessage: string, options: AIAssistantOptions): Promise<AIResponse> {
    try {
      // Get conversation history
      const conversationHistory = await this.getConversationHistory(options.merchantId, options.context);
      
      const systemPrompt = this.getSystemPrompt(options.context, options.merchantData, options.platformData);
      
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add conversation history (limit to last 10 messages to avoid token limits)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));

      // Add current user message
      messages.push({ role: "user", content: userMessage });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        message: result.message || "I'm here to help with your merchant operations.",
        actionRequired: result.actionRequired || false,
        suggestedActions: result.suggestedActions || [],
        data: result.data
      };

    } catch (error) {
      console.error("AI processing error:", error);
      return {
        message: "I'm experiencing some technical difficulties. Please try again or contact support if the issue persists.",
        actionRequired: false
      };
    }
  }

  async generateInsights(analyticsData: any, context: string): Promise<AIResponse> {
    try {
      // First check if we need real-time data for better insights
      const requirement = {
        platforms: ['swiggy', 'zomato', 'magicpin'],
        dataTypes: ['analytics', 'orders', 'ratings'],
        timeframe: 'last_7_days'
      };

      let enhancedData = analyticsData;

      // Try to get real-time data if analytics data is limited
      // if (!analyticsData || Object.keys(analyticsData).length < 5) {
      //   try {
      //     const browserTaskId = await this.extractRealTimeData(1, requirement);
      //     const task = browserService.getTask(browserTaskId);
          
      //     // Wait a bit for data collection
      //     await new Promise(resolve => setTimeout(resolve, 10000));
          
      //     if (task && task.status === 'completed') {
      //       const realTimeData = this.parseRealTimeData(task.result);
      //       enhancedData = { ...analyticsData, ...realTimeData };
      //     }
      //   } catch (error) {
      //     console.log("Could not fetch real-time data for insights:", error.message);
      //   }
      // }

      const prompt = `
        Analyze the following merchant data and provide actionable insights in JSON format:
        
        Analytics Data: ${JSON.stringify(enhancedData)}
        Context: ${context}
        
        Please provide insights in this JSON format:
        {
          "message": "Summary of key insights based on the data",
          "insights": [
            {
              "type": "positive|warning|opportunity|critical",
              "title": "Insight title",
              "description": "Detailed explanation with specific numbers where available",
              "actionRequired": boolean,
              "suggestedAction": "Specific recommendation",
              "platform": "specific platform if applicable",
              "priority": "high|medium|low"
            }
          ],
          "recommendations": [
            {
              "action": "Specific action to take",
              "impact": "Expected impact",
              "timeframe": "When to implement"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || "{}");

    } catch (error) {
      console.error("Insight generation error:", error);
      return {
        message: "Unable to generate insights at this time. Please try again later."
      };
    }
  }

  // New method to handle browser task completion
  async handleBrowserTaskCompletion(taskId: string, originalMessage: string, options: AIAssistantOptions): Promise<AIResponse> {
    try {
      const task = browserService.getTask(taskId);
      
      if (!task) {
        return {
          message: "I couldn't find the data extraction task. Please try your request again.",
          actionRequired: false
        };
      }

      if (task.status === 'failed') {
        return {
          message: "I encountered an issue while fetching the latest data. Let me help you with the information I have available.",
          actionRequired: false
        };
      }

      if (task.status !== 'completed') {
        return {
          message: "I'm still gathering data from your platforms. Please wait a moment...",
          actionRequired: false
        };
      }

      // Process with the real-time data
      return await this.processWithRealTimeData(originalMessage, options, taskId);

    } catch (error) {
      console.error("Browser task completion error:", error);
      return {
        message: "I encountered an issue processing the latest data. How else can I help you?",
        actionRequired: false
      };
    }
  }

  private getSystemPrompt(context: string, merchantData?: any, platformData?: any): string {
    const basePrompt = `
      You are an AI assistant helping merchants manage their multi-platform restaurant operations.
      You have access to platforms like Swiggy, Zomato, and Magicpin.
      
      Merchant Info: ${merchantData ? JSON.stringify(merchantData) : "Not provided"}
      ${platformData ? `Real-time Platform Data: ${JSON.stringify(platformData)}` : ""}
      
      Always respond in JSON format with this structure:
      {
        "message": "Your helpful response with specific data when available",
        "actionRequired": boolean,
        "suggestedActions": [
          {
            "type": "create_offer|update_settings|run_campaign|check_platform|extract_data|etc",
            "description": "What this action does",
            "data": { relevant_data_for_action }
          }
        ],
        "data": { any_relevant_structured_data }
      }
      
      When you have real-time platform data, use specific numbers and facts in your responses.
      Be helpful, concise, and always offer specific, actionable suggestions.
      If you notice issues in the data (like rating drops, order delays, revenue decreases), 
      prioritize addressing those in your response.
    `;

    switch (context) {
      case "offers":
        return basePrompt + `
          Context: Offers Management
          You help create, modify, and optimize promotional offers across delivery platforms.
          Focus on discount strategies, timing, platform selection, and performance optimization.
          Use real-time data to suggest optimal offer timing and discounts.
        `;
      
      case "promotions":
        return basePrompt + `
          Context: Promotions & Campaigns
          You help plan and execute marketing campaigns, seasonal promotions, and competitive strategies.
          Consider timing, audience targeting, budget optimization, and ROI maximization.
          Use current performance data to suggest campaign improvements.
        `;
      
      case "settings":
        return basePrompt + `
          Context: Store Settings
          You help manage store operations like timings, delivery areas, menu availability, and platform configurations.
          Focus on operational efficiency and customer experience optimization.
          Alert about any operational issues found in real-time data.
        `;
      
      case "analytics":
        return basePrompt + `
          Context: Analytics & Reports
          You help interpret performance data, identify trends, and suggest improvements.
          Focus on actionable insights that can improve revenue, efficiency, and customer satisfaction.
          Provide specific analysis of current performance metrics and trends.
        `;
      
      default:
        return basePrompt + `
          Context: General Assistant
          You provide general help and guidance for restaurant operations across all platforms.
          Use available data to provide contextual and relevant assistance.
        `;
    }
  }

  // Utility method to check if a browser task is complete
  async waitForBrowserTask(taskId: string, maxWaitTime: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const task = browserService.getTask(taskId);
      if (task && (task.status === 'completed' || task.status === 'failed')) {
        return task.status === 'completed';
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false; // Timeout
  }
}

export const aiAssistant = new AIAssistant();
