#!/bin/bash
# Deployment script for corporate website

set -e

echo "Starting deployment..."

# Build frontend
npm run build

# Run tests
npm test
pytest tests/

# Deploy to production
echo "Deploying to production server..."
scp -r dist/ user@production-server:/var/www/html/

# Restart services
ssh user@production-server "sudo systemctl restart nginx"

echo "Deployment completed successfully!"
