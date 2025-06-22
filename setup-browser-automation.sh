#!/bin/bash
# setup-browser-automation.sh

echo "Setting up browser automation for platform management..."

# Create scripts directory
mkdir -p scripts

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is required but not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# OpenAI API Key for browser automation
OPENAI_API_KEY=your_openai_api_key_here

# Database connection
DATABASE_URL=your_database_url_here

# Other environment variables
NODE_ENV=development
EOL
    echo ".env file created. Please update it with your actual API keys."
fi

# Install Node.js dependencies (if package.json exists)
if [ -f package.json ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the correct OPENAI_API_KEY"
echo "2. Ensure your DATABASE_URL is correctly configured"
echo "3. Run 'npm run dev' or 'npm start' to start your server"
echo ""
echo "Browser automation endpoints will be available at:"
echo "- POST /api/platforms/connect (with browser automation)"
echo "- POST /api/platforms/action (with browser automation)"
echo "- POST /api/browser/execute (direct browser tasks)"
echo "- GET /api/tasks/:taskId (check task status)"