
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
                url_match = re.search(r'https://[^s]+', content)
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
