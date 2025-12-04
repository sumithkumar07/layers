import subprocess
import sys
import time
import os

def run_services():
    print("Starting Layers Trust OS...")

    # 1. Start Main API (Port 8000)
    print("   - Starting Main API (Port 8000)...")
    api_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.getcwd()
    )

    # 2. Start MCP HTTP Server for Cursor (Port 8001)
    print("   - Starting MCP Server for Cursor (Port 8001)...")
    mcp_process = subprocess.Popen(
        [sys.executable, "-m", "src.mcp_http"],
        cwd=os.getcwd()
    )

    print("\nServices Running!")
    print("   - API:       http://localhost:8000")
    print("   - Cursor:    http://localhost:8001/sse")
    print("\nPress Ctrl+C to stop all services.")
    try:
        # Wait for either process to exit
        while api_process.poll() is None and mcp_process.poll() is None:
            time.sleep(0.1)
        
        # If we're here, at least one process exited
        if api_process.poll() is not None:
            print(f"\nAPI process exited with code {api_process.poll()}")
        if mcp_process.poll() is not None:
            print(f"\nMCP process exited with code {mcp_process.poll()}")
        
        # Terminate any remaining processes
        if api_process.poll() is None:
            api_process.terminate()
        if mcp_process.poll() is None:
            mcp_process.terminate()
    except KeyboardInterrupt:
        print("\nStopping services...")
        api_process.terminate()
        mcp_process.terminate()
        
    # Wait for processes to actually terminate
    api_process.wait(timeout=5)
    mcp_process.wait(timeout=5)
    sys.exit(0)
if __name__ == "__main__":
    run_services()
