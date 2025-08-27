#!/bin/bash

# Azure Deployment Script for CashFlowIQ
# This script will deploy the CashFlowIQ application to Azure App Service

set -e  # Exit on any error

echo "🚀 Starting Azure deployment for CashFlowIQ..."

# Variables
RESOURCE_GROUP="cashflowiq-rg"
APP_SERVICE_PLAN="cashflowiq-plan"
WEB_APP_NAME="cashflowiq-app"
LOCATION="eastus"
SKU="B1"
RUNTIME="NODE|20-lts"

# Step 1: Login to Azure (if not already logged in)
echo "📝 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "🔑 Please login to Azure..."
    az login
else
    echo "✅ Already logged in to Azure"
fi

# Step 2: Create Resource Group
echo "🏗️  Creating resource group: $RESOURCE_GROUP..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

# Step 3: Create App Service Plan
echo "📋 Creating App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku $SKU \
    --is-linux \
    --output table

# Step 4: Create Web App
echo "🌐 Creating Web App: $WEB_APP_NAME..."
az webapp create \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "$RUNTIME" \
    --output table

# Step 5: Configure App Settings (Environment Variables)
echo "⚙️  Configuring environment variables..."
az webapp config appsettings set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        VITE_POCKETBASE_URL="https://your-app.pockethost.io" \
        POCKETBASE_ADMIN_EMAIL="admin@cashflowiq.com" \
        POCKETBASE_ADMIN_PASSWORD="SecurePassword123!" \
        NODE_ENV="production" \
        PORT="8080" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    --output table

# Step 6: Configure startup command
echo "🔧 Setting startup command..."
az webapp config set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "npm run azure:start" \
    --output table

# Step 7: Enable Git deployment
echo "📚 Setting up Git deployment..."
az webapp deployment source config-local-git \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --output table

# Step 8: Get deployment credentials
echo "🔐 Getting deployment credentials..."
DEPLOYMENT_URL=$(az webapp deployment list-publishing-credentials \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query "{url:scmUri}" \
    --output tsv)

echo "📦 Deployment URL: $DEPLOYMENT_URL"

# Step 9: Add Azure remote and deploy
echo "🚀 Adding Azure remote and deploying..."
git remote remove azure 2>/dev/null || true  # Remove if exists
git remote add azure $DEPLOYMENT_URL

echo "📤 Pushing to Azure..."
git push azure main

# Step 10: Get the application URL
echo "🌍 Getting application URL..."
APP_URL=$(az webapp browse --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" --output tsv)

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now available at: https://$APP_URL"
echo ""
echo "📋 Deployment Summary:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Service Plan: $APP_SERVICE_PLAN"
echo "  Web App Name: $WEB_APP_NAME"
echo "  Location: $LOCATION"
echo "  Runtime: $RUNTIME"
echo ""
echo "🔧 To view logs: az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP"
echo "⚙️  To update settings: az webapp config appsettings set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE"
echo ""