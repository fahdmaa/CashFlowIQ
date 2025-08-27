# Azure Deployment Guide for CashFlowIQ

This document provides comprehensive instructions for deploying the CashFlowIQ application to Azure App Service.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed and configured
- Git repository with the latest code
- Node.js 20.x installed locally (for testing)

## Project Structure

The application has been prepared for Azure deployment with the following key files:

- `azure-server.js` - Entry point optimized for Azure App Service
- `web.config` - IIS configuration for Windows App Service (backup)
- `.deployment` - Azure deployment configuration
- `deploy-azure.sh` - Automated deployment script
- Modified `package.json` with Azure-specific scripts

## Deployment Options

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script to automatically set up all Azure resources and deploy the application.

1. **Make the script executable** (if not already):
   ```bash
   chmod +x deploy-azure.sh
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-azure.sh
   ```

The script will:
- Login to Azure (if needed)
- Create the resource group `cashflowiq-rg`
- Create the App Service plan `cashflowiq-plan` (B1 Basic tier)
- Create the Web App `cashflowiq-app`
- Configure environment variables
- Set up Git-based deployment
- Deploy the application

### Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

#### Step 1: Login to Azure
```bash
az login
```

#### Step 2: Create Resource Group
```bash
az group create \
    --name cashflowiq-rg \
    --location eastus
```

#### Step 3: Create App Service Plan
```bash
az appservice plan create \
    --name cashflowiq-plan \
    --resource-group cashflowiq-rg \
    --location eastus \
    --sku B1 \
    --is-linux
```

#### Step 4: Create Web App
```bash
az webapp create \
    --name cashflowiq-app \
    --resource-group cashflowiq-rg \
    --plan cashflowiq-plan \
    --runtime "NODE|20-lts"
```

#### Step 5: Configure Environment Variables
```bash
az webapp config appsettings set \
    --name cashflowiq-app \
    --resource-group cashflowiq-rg \
    --settings \
        VITE_POCKETBASE_URL="https://your-app.pockethost.io" \
        POCKETBASE_ADMIN_EMAIL="admin@cashflowiq.com" \
        POCKETBASE_ADMIN_PASSWORD="SecurePassword123!" \
        NODE_ENV="production" \
        PORT="8080" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true"
```

#### Step 6: Set Startup Command
```bash
az webapp config set \
    --name cashflowiq-app \
    --resource-group cashflowiq-rg \
    --startup-file "npm run azure:start"
```

#### Step 7: Enable Git Deployment
```bash
az webapp deployment source config-local-git \
    --name cashflowiq-app \
    --resource-group cashflowiq-rg
```

#### Step 8: Deploy the Application
```bash
# Get the deployment URL
DEPLOYMENT_URL=$(az webapp deployment list-publishing-credentials \
    --name cashflowiq-app \
    --resource-group cashflowiq-rg \
    --query "{url:scmUri}" \
    --output tsv)

# Add Azure remote
git remote add azure $DEPLOYMENT_URL

# Deploy
git push azure main
```

## Environment Variables

The following environment variables are configured for the Azure deployment:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_POCKETBASE_URL` | `https://your-app.pockethost.io` | PocketBase backend URL (update with actual URL) |
| `POCKETBASE_ADMIN_EMAIL` | `admin@cashflowiq.com` | Admin email for PocketBase |
| `POCKETBASE_ADMIN_PASSWORD` | `SecurePassword123!` | Admin password for PocketBase |
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8080` | Application port |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | Enable build during deployment |

## Build Process

The application uses the following build commands:

- **Development**: `npm run dev`
- **Build**: `npm run azure:build` (builds both client and server)
- **Start**: `npm run azure:start` (production start with Azure server)

## File Structure After Deployment

```
/
├── azure-server.js          # Azure entry point
├── dist/
│   ├── public/             # Built client files
│   │   ├── assets/         # JS and CSS bundles
│   │   └── index.html      # Main HTML file
│   └── server/             # Built server files
├── web.config              # IIS configuration (if needed)
├── .deployment             # Azure deployment config
└── package.json            # Dependencies and scripts
```

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   ```bash
   # Check build logs
   az webapp log tail --name cashflowiq-app --resource-group cashflowiq-rg
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify environment variables
   az webapp config appsettings list --name cashflowiq-app --resource-group cashflowiq-rg
   ```

3. **Application Not Starting**
   ```bash
   # Check application logs
   az webapp log tail --name cashflowiq-app --resource-group cashflowiq-rg
   
   # Verify startup command
   az webapp config show --name cashflowiq-app --resource-group cashflowiq-rg --query "siteConfig.appCommandLine"
   ```

### Useful Commands

```bash
# View application logs
az webapp log tail --name cashflowiq-app --resource-group cashflowiq-rg

# Restart the application
az webapp restart --name cashflowiq-app --resource-group cashflowiq-rg

# Update environment variables
az webapp config appsettings set --name cashflowiq-app --resource-group cashflowiq-rg --settings NEW_VAR=value

# Scale the application
az appservice plan update --name cashflowiq-plan --resource-group cashflowiq-rg --sku S1

# View resource usage
az monitor metrics list --resource /subscriptions/{subscription-id}/resourceGroups/cashflowiq-rg/providers/Microsoft.Web/sites/cashflowiq-app --metric "CpuPercentage,MemoryPercentage"
```

## Security Considerations

1. **Update Default Passwords**: Change the default PocketBase admin password
2. **Environment Variables**: Store sensitive data in Azure Key Vault for production
3. **HTTPS**: Azure App Service provides HTTPS by default
4. **Authentication**: Configure authentication providers if needed

## Cost Optimization

- **B1 Basic Plan**: $12.41/month (estimated)
- **Monitor Usage**: Use Azure Cost Management to track expenses
- **Scaling**: Consider scaling down to Free tier for development/testing

## Next Steps

1. **Update PocketBase URL**: Replace the placeholder URL with your actual PocketBase instance
2. **Set up Custom Domain**: Configure a custom domain if needed
3. **Configure SSL**: Set up SSL certificates for custom domains
4. **Monitor Performance**: Set up Application Insights for monitoring
5. **Backup Strategy**: Configure backup and disaster recovery

## Support

For issues with this deployment:

1. Check Azure App Service logs
2. Verify environment variables
3. Test the build process locally
4. Review the Azure App Service documentation

---

**Last Updated**: August 27, 2025
**Azure CLI Version**: 2.76.0
**Node.js Version**: 20.x LTS