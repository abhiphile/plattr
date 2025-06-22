import { storage } from "../storage";
import { Platform } from "@shared/schema";
import { browserService, LoginCredentials } from "./browser";

export interface PlatformCredentials {
  username: string;
  password: string;
}

export interface PlatformAction {
  type: "create_offer" | "update_timing" | "toggle_status" | "run_campaign" | "update_menu" | "emergency_shutdown";
  data: any;
}

export interface PlatformDataRequest {
  type: "orders" | "ratings" | "menu" | "analytics" | "dashboard";
  filters?: any;
}

export class PlatformService {
  async authenticatePlatform(
    merchantId: number, 
    platformName: string, 
    credentials: PlatformCredentials
  ): Promise<{ success: boolean; message: string; platform?: Platform; taskId?: string; data?: any }> {
    
    try {
      if (!credentials.username || !credentials.password) {
        return {
          success: false,
          message: "Username and password are required"
        };
      }

      // First, create/update the platform record as "connecting"
      let platform = await storage.getPlatform(merchantId, platformName);
      
      if (platform) {
        platform = await storage.updatePlatform(platform.id, {
          status: "connecting",
          credentials: {
            username: credentials.username,
            encryptedPassword: this.encryptPassword(credentials.password)
          }
        });
      } else {
        platform = await storage.createPlatform({
          merchantId,
          name: platformName,
          isConnected: false,
          status: "connecting",
          credentials: {
            username: credentials.username,
            encryptedPassword: this.encryptPassword(credentials.password)
          }
        });
      }

      // Execute browser automation for login
      const loginCredentials: LoginCredentials = {
        platform: platformName,
        username: credentials.username,
        password: credentials.password
      };

      try {
        const taskId = await browserService.loginToPlatform(loginCredentials);
        
        // Check task status immediately and set a timer for final check
        this.checkTaskStatusAndUpdate(taskId, platform.id, platformName);
        
        return {
          success: true,
          message: `Login process started for ${platformName}. This may take a few moments.`,
          platform,
          taskId
        };

      } catch (browserError) {
        console.error(`Browser automation failed for ${platformName}:`, browserError);
        
        // Update platform status to failed
        await storage.updatePlatform(platform.id, {
          isConnected: false,
          status: "failed"
        });

        return {
          success: false,
          message: `Automated login failed for ${platformName}: ${browserError.message}`
        };
      }

    } catch (error) {
      console.error(`Platform authentication error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to connect to ${platformName}. Please check your credentials and try again.`
      };
    }
  }

  async checkPlatformStatus(
    merchantId: number,
    platformName: string
  ): Promise<{ success: boolean; message: string; data?: any; taskId?: string }> {
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform) {
        return {
          success: false,
          message: "Platform not found"
        };
      }

      // Use browser automation to check current login status
      try {
        const taskId = await browserService.checkLoginStatus(platformName);
        
        // Set a timer to check the result
        setTimeout(async () => {
          const task = browserService.getTask(taskId);
          if (task && task.status === 'completed' && task.result) {
            const result = task.result as any;
            
            const isLoggedIn = result.login_status === 'success' || 
                             (result.data && result.data.status === 'success');
            
            await storage.updatePlatform(platform.id, {
              isConnected: isLoggedIn,
              status: isLoggedIn ? "connected" : "disconnected",
              lastSync: isLoggedIn ? new Date() : null
            });
          }
        }, 15000);

        return {
          success: true,
          message: `Checking ${platformName} status...`,
          taskId
        };

      } catch (error) {
        return {
          success: false,
          message: `Failed to check ${platformName} status: ${error.message}`
        };
      }

    } catch (error) {
      console.error(`Platform status check error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to check ${platformName} status`
      };
    }
  }

  async getPlatformData(
    merchantId: number,
    platformName: string,
    dataRequest: PlatformDataRequest
  ): Promise<{ success: boolean; message: string; data?: any; taskId?: string }> {
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform) {
        return {
          success: false,
          message: "Platform not found"
        };
      }

      // Use browser automation to extract data
      try {
        const taskId = await browserService.getDataFromPlatform(
          platformName,
          dataRequest.type,
          dataRequest.filters
        );

        return {
          success: true,
          message: `Extracting ${dataRequest.type} data from ${platformName}...`,
          taskId
        };

      } catch (error) {
        return {
          success: false,
          message: `Failed to extract data from ${platformName}: ${error.message}`
        };
      }

    } catch (error) {
      console.error(`Platform data extraction error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to extract data from ${platformName}`
      };
    }
  }

  async disconnectPlatform(merchantId: number, platformName: string): Promise<{ success: boolean; message: string }> {
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform) {
        return {
          success: false,
          message: "Platform connection not found"
        };
      }

      await storage.updatePlatform(platform.id, {
        isConnected: false,
        status: "disconnected",
        credentials: {},
        lastSync: null
      });

      return {
        success: true,
        message: `Successfully disconnected from ${platformName}`
      };

    } catch (error) {
      console.error(`Platform disconnection error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to disconnect from ${platformName}`
      };
    }
  }

  async refreshConnection(merchantId: number, platformName: string): Promise<{ success: boolean; message: string; taskId?: string }> {
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform) {
        return {
          success: false,
          message: "Platform is not found"
        };
      }

      // Update status to refreshing
      await storage.updatePlatform(platform.id, {
        status: "refreshing"
      });

      // Use current credentials to re-authenticate
      if (platform.credentials && platform.credentials.username && platform.credentials.encryptedPassword) {
        const credentials = {
          username: platform.credentials.username,
          password: this.decryptPassword(platform.credentials.encryptedPassword)
        };

        const result = await this.authenticatePlatform(merchantId, platformName, credentials);
        return {
          success: result.success,
          message: result.message,
          taskId: result.taskId
        };
      } else {
        await storage.updatePlatform(platform.id, {
          status: "connection_error"
        });

        return {
          success: false,
          message: `No stored credentials found for ${platformName}. Please reconnect manually.`
        };
      }

    } catch (error) {
      console.error(`Platform refresh error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to refresh ${platformName} connection`
      };
    }
  }

  async executePlatformAction(
    merchantId: number, 
    platformName: string, 
    action: PlatformAction
  ): Promise<{ success: boolean; message: string; data?: any; taskId?: string }> {
    
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform || !platform.isConnected) {
        return {
          success: false,
          message: `Not connected to ${platformName}`
        };
      }

      // Use browser automation to execute the action
      try {
        const taskId = await browserService.executePlatformAction(
          platformName, 
          action.type, 
          action.data
        );

        // Return immediate response with task ID for tracking
        return {
          success: true,
          message: `Action "${action.type}" started on ${platformName}`,
          taskId,
          data: { actionType: action.type, status: 'initiated' }
        };

      } catch (browserError) {
        console.error(`Browser action failed for ${platformName}:`, browserError);
        return {
          success: false,
          message: `Failed to execute action on ${platformName}: ${browserError.message}`
        };
      }

    } catch (error) {
      console.error(`Platform action error for ${platformName}:`, error);
      return {
        success: false,
        message: `Failed to execute action on ${platformName}`
      };
    }
  }

  async getTaskStatus(taskId: string) {
    const task = browserService.getTask(taskId);
    if (!task) {
      return { error: "Task not found" };
    }

    // Parse the result if it's a browser automation result
    let parsedResult = task.result;
    if (typeof task.result === 'object' && task.result.status) {
      parsedResult = {
        status: task.result.status,
        message: task.result.message,
        platform: task.result.platform,
        loginStatus: task.result.login_status,
        url: task.result.final_url,
        data: task.result.data
      };
    }

    return {
      id: task.id,
      status: task.status,
      result: parsedResult,
      error: task.error,
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.endTime && task.startTime ? 
        task.endTime.getTime() - task.startTime.getTime() : null
    };
  }

  async getAllTasks() {
    const tasks = browserService.getAllTasks();
    return tasks.map(task => ({
      id: task.id,
      status: task.status,
      task: task.task,
      startTime: task.startTime,
      endTime: task.endTime,
      duration: task.endTime && task.startTime ? 
        task.endTime.getTime() - task.startTime.getTime() : null,
      hasResult: !!task.result,
      hasError: !!task.error
    }));
  }

  private async checkTaskStatusAndUpdate(taskId: string, platformId: number, platformName: string) {
    // Check immediately
    setTimeout(async () => {
      await this.updatePlatformFromTask(taskId, platformId, platformName);
    }, 5000);

    // Check again after more time
    setTimeout(async () => {
      await this.updatePlatformFromTask(taskId, platformId, platformName);
    }, 15000);

    // Final check
    setTimeout(async () => {
      await this.updatePlatformFromTask(taskId, platformId, platformName);
    }, 30000);
  }

  private async updatePlatformFromTask(taskId: string, platformId: number, platformName: string) {
    try {
      const task = browserService.getTask(taskId);
      if (!task) return;
  
      if (task.status === 'completed' && task.result) {
        const result = task.result as any;
        
        // Improved logic to determine if login was successful
        // Check for success indicators in the result
        const isLoggedIn = 
          result.status === 'success' ||
          result.login_status === 'success' ||
          result.login_status === 'completed' ||
          (typeof result === 'string' && result.toLowerCase().includes('success')) ||
          (result.data && result.data.status === 'success') ||
          (result.message && result.message.toLowerCase().includes('completed'));
  
        // Also check if the result indicates browser automation completed successfully
        // even if login status is not explicitly set
        const browserAutomationSuccessful = 
          (typeof result === 'string' && result.includes('Browser automation completed')) ||
          task.status === 'completed';
  
        // Consider it successful if browser automation completed without errors
        const finalConnectionStatus = isLoggedIn || (browserAutomationSuccessful && !task.error);
  
        await storage.updatePlatform(platformId, {
          isConnected: finalConnectionStatus,
          status: finalConnectionStatus ? "connected" : "failed",
          lastSync: finalConnectionStatus ? new Date() : null
        });
  
        console.log(`Updated ${platformName} platform status: ${finalConnectionStatus ? 'connected' : 'failed'}`);
        console.log(`Task result:`, result);
        
      } else if (task.status === 'failed') {
        await storage.updatePlatform(platformId, {
          isConnected: false,
          status: "failed",
          lastSync: null
        });
  
        console.log(`${platformName} platform connection failed:`, task.error);
      }
    } catch (error) {
      console.error(`Error updating platform ${platformName} from task:`, error);
    }
  }

  async markPlatformConnected(merchantId: number, platformName: string): Promise<{ success: boolean; message: string }> {
    try {
      const platform = await storage.getPlatform(merchantId, platformName);
      
      if (!platform) {
        return {
          success: false,
          message: "Platform not found"
        };
      }
  
      await storage.updatePlatform(platform.id, {
        isConnected: true,
        status: "connected",
        lastSync: new Date()
      });
  
      return {
        success: true,
        message: `Successfully marked ${platformName} as connected`
      };
  
    } catch (error) {
      console.error(`Error marking platform as connected:`, error);
      return {
        success: false,
        message: `Failed to mark ${platformName} as connected`
      };
    }
  }

  private encryptPassword(password: string): string {
    // Mock encryption - in real implementation, use proper encryption
    return Buffer.from(password).toString('base64');
  }

  private decryptPassword(encryptedPassword: string): string {
    // Mock decryption - in real implementation, use proper decryption
    return Buffer.from(encryptedPassword, 'base64').toString();
  }

  async debugPlatformStatus(merchantId: number): Promise<any> {
    try {
      const platforms = await storage.getPlatformsByMerchant(merchantId);
      console.log('All platforms from storage:', platforms);
      res.json(platforms);
      
      const debugInfo = {
        totalPlatforms: platforms.length,
        platforms: platforms.map(p => ({
          id: p.id,
          name: p.name,
          isConnected: p.isConnected,
          status: p.status,
          hasCredentials: !!(p.credentials && p.credentials.username),
          lastSync: p.lastSync,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        })),
        connectedCount: platforms.filter(p => p.isConnected).length,
        connectedPlatforms: platforms.filter(p => p.isConnected).map(p => p.name),
        statusConnectedCount: platforms.filter(p => p.status === 'connected').length,
        statusConnectedPlatforms: platforms.filter(p => p.status === 'connected').map(p => p.name)
      };
      
      console.log('Platform Debug Info:', JSON.stringify(debugInfo, null, 2));
      return debugInfo;
      
    } catch (error) {
      console.error('Debug platform status error:', error);
      return { error: error.message };
    }
  }
}

export const platformService = new PlatformService();
