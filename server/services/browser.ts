import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface BrowserTask {
  id: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface LoginCredentials {
  platform: string;
  username: string;
  password: string;
  url?: string;
}

export interface BrowserResult {
  status: 'success' | 'error';
  result?: string;
  error?: string;
  data?: any;
}

export class BrowserAutomationService {
  private tasks: Map<string, BrowserTask> = new Map();
  private pythonScriptPath: string;

  constructor() {
    // Path to the Python script - adjust based on your project structure
    this.pythonScriptPath = path.join(process.cwd(), 'scripts', 'browser_agent.py');
    this.ensurePythonScript();
  }

  private async ensurePythonScript() {
    try {
      const scriptDir = path.dirname(this.pythonScriptPath);
      await fs.mkdir(scriptDir, { recursive: true });

      const pythonScript = `
import asyncio
import sys
import json
import os
from dotenv import load_dotenv
from browser_use import Agent
from langchain_openai import ChatOpenAI

load_dotenv()

async def main(task_data: str):
    try:
        # Parse the task data
        data = json.loads(task_data)
        task = data.get('task', '')
        platform = data.get('platform', '')
        
        # Initialize the agent
        agent = Agent(
            task=task,
            llm=ChatOpenAI(model="gpt-4o"),
        )
        
        # Run the agent
        history = await agent.run()
        result = history.final_result()

        # Save to a text file
        with open("output.txt", "w") as file:
            file.write(result)




        history.save_to_file("agent_history.json")
        print("Final Output:", history.final_result(), "model_actions: ", history.action_results(), "steps: ", history.number_of_steps())

        with open("agent_history.json", "r") as f:
            data = json.load(f)

        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Agent History Report</title>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; table-layout: fixed; }
                th, td {
                    border: 1px solid #ccc;
                    padding: 14px 10px;
                    text-align: left;
                    vertical-align: top;
                    word-break: break-word;
                    white-space: pre-line;
                }
                th { background: #f4f4f4; }
                tr:nth-child(even) { background: #fafbfc; }
                tr:nth-child(odd) { background: #fff; }
                .screenshot-cell { text-align: center; }
                .screenshot { max-width: 320px; max-height: 200px; display: block; margin: 0 auto; border: 1px solid #bbb; box-shadow: 0 2px 8px #eee; }
                .goal { font-weight: bold; color: #2a2; }
                .stepnum { font-weight: bold; text-align: center; }
                .monospace { font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace; font-size: 0.98em; }
            </style>
        </head>
        <body>
            <h1>Agent History Report</h1>
            <table>
                <tr>
                    <th style="width: 60px;">Step</th>
                    <th style="width: 180px;">URL</th>
                    <th style="width: 160px;">Title</th>
                    <th style="width: 340px;">Screenshot</th>
                    <th style="width: 260px;">Extracted Content</th>
                </tr>
        """

        for i, step in enumerate(data["history"]):
            state = step.get("state", {})
            model_output = step.get("model_output", {})
            result = step.get("result", [{}])[0]
            screenshot = state.get("screenshot")
            url = state.get("url", "")
            title = state.get("title", "")
            extracted_content = result.get("extracted_content", "")

            html += f'<tr>'
            html += f'<td class="stepnum">{i+1}</td>'
            html += f'<td>{url}</td>'
            html += f'<td>{title}</td>'
            if screenshot:
                html += f'<td class="screenshot-cell"><img class="screenshot" src="data:image/png;base64,{screenshot}" alt="Screenshot Step {i+1}"/></td>'
            else:
                html += f'<td class="screenshot-cell"></td>'
            html += f'<td class="goal">{goal}</td>'
            html += f'<td class="monospace">{thinking}</td>'
            html += f'<td class="monospace">{extracted_content}</td>'
            html += '</tr>'

        html += """
            </table>
        </body></html>
        """

        with open("agent_history_report.html", "w") as f:
            f.write(html)

        print("HTML report generated: agent_history_report.html")
        
        # Extract meaningful information
        final_url = ""
        login_status = "unknown"
        
        # Try to get the final URL and status from the result
        if hasattr(result, 'extracted_content'):
            content = str(result.extracted_content)
            if "https://" in content:
                # Extract URL from content
                import re
                url_match = re.search(r'https://[^\s]+', content)
                if url_match:
                    final_url = url_match.group()
            
            if "successfully" in content.lower() or "success" in content.lower():
                login_status = "success"
            elif "failed" in content.lower() or "error" in content.lower():
                login_status = "failed"
            else:
                login_status = "completed"
        
        # Return structured success result
        response = {
            "status": "success",
            "platform": platform,
            "login_status": login_status,
            "final_url": final_url,
            "result": str(history.final_result()),
            "message": f"Browser automation completed for {platform}",
            "data": {
                "platform": platform,
                "status": login_status,
                "url": final_url,
                "timestamp": str(asyncio.get_event_loop().time())
            }
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        # Return structured error result
        error_response = {
            "status": "error",
            "error": str(e),
            "platform": data.get('platform', 'unknown') if 'data' in locals() else 'unknown',
            "message": f"Browser automation failed: {str(e)}"
        }
        print(json.dumps(error_response))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error", 
            "error": "No task data provided",
            "message": "Task data is required"
        }))
        sys.exit(1)
    
    task_input = sys.argv[1]
    asyncio.run(main(task_input))
`;

      await fs.writeFile(this.pythonScriptPath, pythonScript);
    } catch (error) {
      console.error('Failed to create Python script:', error);
    }
  }

  async executeTask(taskDescription: string, additionalData?: any): Promise<string> {
    const taskId = this.generateTaskId();
    const task: BrowserTask = {
      id: taskId,
      task: taskDescription,
      status: 'pending',
      startTime: new Date()
    };

    this.tasks.set(taskId, task);

    try {
      task.status = 'running';
      this.tasks.set(taskId, task);

      const taskData = {
        task: taskDescription,
        ...additionalData
      };

      const result = await this.runPythonScript(JSON.stringify(taskData));
      
      task.status = 'completed';
      task.result = result;
      task.endTime = new Date();
      this.tasks.set(taskId, task);

      return taskId;

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.endTime = new Date();
      this.tasks.set(taskId, task);

      throw error;
    }
  }

  async loginToPlatform(credentials: LoginCredentials): Promise<string> {
    const loginTask = this.buildLoginTask(credentials);
    return await this.executeTask(loginTask, { 
      credentials,
      platform: credentials.platform 
    });
  }

  async checkLoginStatus(platform: string, url?: string): Promise<string> {
    const checkTask = this.buildLoginCheckTask(platform, url);
    return await this.executeTask(checkTask, { 
      platform,
      action: 'check_login'
    });
  }

  async executePlatformAction(platform: string, action: string, data?: any): Promise<string> {
    const actionTask = this.buildActionTask(platform, action, data);
    return await this.executeTask(actionTask, { platform, action, data });
  }

  async getDataFromPlatform(platform: string, dataType: string, filters?: any): Promise<string> {
    const dataTask = this.buildDataExtractionTask(platform, dataType, filters);
    return await this.executeTask(dataTask, { 
      platform, 
      action: 'extract_data',
      dataType,
      filters
    });
  }

  getTask(taskId: string): BrowserTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): BrowserTask[] {
    return Array.from(this.tasks.values());
  }

  private buildLoginTask(credentials: LoginCredentials): string {
    const platformUrls = {
      'swiggy': 'https://partner.swiggy.com/login',
      'zomato': 'https://www.zomato.com/partner/login',
      'magicpin': 'https://magicpin.in/partners/adminDashboard'
    };

    const url = credentials.url || platformUrls[credentials.platform.toLowerCase()];
    
    return `
      Navigate to ${url} and perform login operation with the following steps:
      1. First check if already logged in by looking for dashboard elements or user profile
      2. If already logged in, return success with current URL and login status
      3. If not logged in, proceed with login:
         - Find and click on the username/email input field
         - Enter the username: ${credentials.username}
         - Find and click on the password input field  
         - Enter the password: ${credentials.password}
         - Find and click the login/submit button
         - Wait for the page to load and verify successful login
      4. Return the current page URL, login status, and any relevant dashboard information
      5. If login fails, provide specific error details
    `;
  }

  private buildLoginCheckTask(platform: string, url?: string): string {
    const platformUrls = {
      'swiggy': 'https://partner.swiggy.com/dashboard',
      'zomato': 'https://www.zomato.com/partner/dashboard', 
      'magicpin': 'https://magicpin.in/partners/dashboard'
    };

    const checkUrl = url || platformUrls[platform.toLowerCase()];
    
    return `
      Navigate to ${checkUrl} and check current login status:
      1. Load the page and wait for it to fully render
      2. Check if user is currently logged in by looking for:
         - Dashboard elements
         - User profile information
         - Navigation menus
         - Any login-required content
      3. If logged in, extract key information like:
         - Current user/restaurant name
         - Dashboard metrics if visible
         - Available menu options
      4. If not logged in, note what login elements are visible
      5. Return detailed status about login state and available information
    `;
  }

  private buildDataExtractionTask(platform: string, dataType: string, filters?: any): string {
    // Fixed platform URLs
    const platformUrls = {
      'swiggy': 'https://partner.swiggy.com/dashboard',
      'zomato': 'https://www.zomato.com/partner/dashboard', 
      'magicpin': 'https://magicpin.in/partners/dashboard'
    };
  
    const url = platformUrls[platform.toLowerCase()];
    if (!url) {
      return `Error: Unsupported platform ${platform}`;
    }
  
    const baseTask = `Navigate directly to ${url} and extract ${dataType} data`;
    
    switch (dataType) {
      case 'views':
        return `${baseTask}. Extract view/visit information including:
          - Total page views from all dashboard sections
          - Visit statistics and metrics
          - Traffic data and engagement numbers
          - View counts from different tabs and sections
          Navigate through all available tabs to collect comprehensive view data.
          ${filters ? `Apply filters: ${JSON.stringify(filters)}` : ''}`;
  
      case 'orders':
        return `${baseTask}. Extract recent order information including:
          - Order counts and trends
          - Revenue figures
          - Average order values
          - Peak hours data
          Navigate to orders section in the dashboard.
          ${filters ? `Apply filters: ${JSON.stringify(filters)}` : ''}`;
  
      case 'ratings':
        return `${baseTask}. Extract rating and review information:
          - Current overall rating
          - Recent rating trends
          - Customer feedback summary
          - Areas for improvement
          Navigate to ratings/reviews section in the dashboard.`;
  
      case 'menu':
        return `${baseTask}. Extract menu information:
          - Available items and categories
          - Pricing information
          - Item availability status
          - Popular items data
          Navigate to menu management section in the dashboard.`;
  
      case 'analytics':
      case 'dashboard':
        return `${baseTask}. Extract analytics and performance data:
          - Revenue metrics
          - Order volume trends
          - Customer satisfaction scores
          - Platform-specific insights
          - View/visit statistics
          - Performance indicators
          Navigate through all dashboard sections and tabs to collect comprehensive data.`;
  
      default:
        return `${baseTask}. Extract available information of type: ${dataType}
          Navigate to relevant sections in the dashboard to collect the requested data.`;
    }
  }

  private buildActionTask(platform: string, action: string, data?: any): string {
    const baseTask = `On ${platform} platform, execute the following action: ${action}`;
    
    if (!data) return baseTask;

    switch (action) {
      case 'create_offer':
        return `${baseTask}. Create a new offer with these details:
          - Title: ${data.title || 'Special Offer'}
          - Discount: ${data.discount || '10%'}
          - Valid until: ${data.validUntil || 'End of day'}
          - Description: ${data.description || 'Limited time offer'}
          - Applicable items: ${data.items ? JSON.stringify(data.items) : 'All items'}`;

      case 'update_timing':
        return `${baseTask}. Update store timings:
          - Opening time: ${data.openTime || '09:00'}
          - Closing time: ${data.closeTime || '23:00'}
          - Days: ${data.days || 'All days'}
          - Special hours: ${data.specialHours || 'None'}`;

      case 'toggle_status':
        return `${baseTask}. Toggle store status to: ${data.status || 'online'}
          - Reason: ${data.reason || 'Manual update'}
          - Duration: ${data.duration || 'Indefinite'}`;

      case 'update_menu':
        return `${baseTask}. Update menu items:
          - Items to add: ${JSON.stringify(data.addItems || [])}
          - Items to remove: ${JSON.stringify(data.removeItems || [])}
          - Items to modify: ${JSON.stringify(data.modifyItems || [])}
          - Category changes: ${JSON.stringify(data.categoryChanges || [])}`;

      default:
        return `${baseTask}. Additional data: ${JSON.stringify(data)}`;
    }
  }

  private runPythonScript(taskData: string): Promise<BrowserResult> {
    return new Promise((resolve, reject) => {
      console.log('Starting Python browser automation script...');
      const pythonProcess = spawn('python', [this.pythonScriptPath, taskData]);
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        // Log real-time updates but filter out JSON output
        if (!chunk.trim().startsWith('{')) {
          console.log('[Browser Agent]', chunk.trim());
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        // Log stderr but filter out INFO logs to reduce noise
        if (!chunk.includes('INFO') && chunk.trim()) {
          console.error('[Browser Agent Error]', chunk.trim());
        }
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python script finished with code: ${code}`);
        
        if (code !== 0) {
          console.error('Python script stderr:', stderr);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Extract JSON from stdout (last line should be the JSON result)
          const lines = stdout.trim().split('\n');
          let jsonResult = '';
          
          // Find the JSON result (should be the last valid JSON line)
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
              jsonResult = line;
              break;
            }
          }

          if (!jsonResult) {
            throw new Error('No valid JSON result found in output');
          }

          const result = JSON.parse(jsonResult);
          console.log('Browser automation result:', result.status, result.message || result.error);
          
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python script output:', stdout);
          console.error('Parse error:', parseError);
          reject(new Error(`Failed to parse Python script output: ${parseError.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python script:', error);
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });

      // Set a timeout for the process
      setTimeout(() => {
        if (!pythonProcess.killed) {
          console.log('Browser automation timeout, killing process...');
          pythonProcess.kill('SIGTERM');
          reject(new Error('Browser automation timed out after 60 seconds'));
        }
      }, 300000); // 60 second timeout
    });
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const browserService = new BrowserAutomationService();
