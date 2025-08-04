# Deployment Guide for Vercel

## Prerequisites
1. Make sure you have a GitHub account
2. Make sure your code is pushed to GitHub
3. Have a Vercel account (you can sign up with GitHub)

## Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `semantic_response_generator` repository
   - Click "Import"

3. **Configure Project Settings**
   - Project Name: `semantic_response_generator` (or your preferred name)
   - Framework Preset: `Node.js`
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (should be auto-detected)
   - Output Directory: `./` (leave as default)

4. **Environment Variables**
   - Add your `GEMINI_API_KEY` if needed
   - Go to Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = your API key value

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts**
   - Link to existing project or create new
   - Set project name
   - Confirm deployment settings

## Post-Deployment

### Access Your App
- Your app will be available at: `https://your-project-name.vercel.app`
- The main page: `https://your-project-name.vercel.app/`
- Generator page: `https://your-project-name.vercel.app/generator`
- Demo page: `https://your-project-name.vercel.app/demo`
- Parser test page: `https://your-project-name.vercel.app/parser-test`

### Environment Variables
If you need to add environment variables after deployment:
1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add your variables (e.g., `GEMINI_API_KEY`)
4. Redeploy if necessary

### Custom Domain (Optional)
1. Go to your project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure `vercel.json` is properly configured

2. **Environment Variables**
   - Make sure sensitive data is in environment variables, not in code
   - Check that environment variables are properly set in Vercel dashboard

3. **CORS Issues**
   - The proxy server should handle CORS automatically
   - If issues persist, check the proxy endpoint configuration

4. **Static Files Not Loading**
   - Ensure all HTML, CSS, and JS files are in the root directory
   - Check that file paths in HTML files are correct

### Support
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions) 