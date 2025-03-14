# Konipai Tote Bag Hub

A modern e-commerce platform for tote bags built with React, TypeScript, and Appwrite.

## Features

- User authentication and profile management
- Product browsing and filtering
- Shopping cart functionality
- Order processing and history
- Address management
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Appwrite (Authentication, Database, Storage)
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/konipai-tote-bag-hub.git
   cd konipai-tote-bag-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your Appwrite credentials:
   ```
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your-project-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Appwrite Setup

1. Create a new project in Appwrite
2. Set up the following collections in your database:
   - `orders`: For storing order information
   - `addresses`: For storing user addresses

3. Run the setup scripts to create the necessary attributes and indexes:
   ```bash
   # Set up the APPWRITE_API_KEY in your .env file first
   node scripts/update-addresses-collection.js
   node scripts/create-address-indexes.js
   ```

4. Configure Appwrite platforms for CORS:
   - Go to your Appwrite console > Project Settings > Platforms
   - Add a platform for local development:
     - Type: Web
     - Name: Local Development
     - Hostname: http://localhost:8081 (or your local dev port)
   - Add a platform for Netlify:
     - Type: Web
     - Name: Netlify Deployment
     - Hostname: https://your-site-name.netlify.app

   You can also use our helper script:
   ```bash
   npm run update:platforms
   ```

## Deployment to Netlify

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to Netlify using the Netlify CLI or drag-and-drop interface.

### Continuous Deployment

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add the required environment variables in the Netlify dashboard:
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`

### Troubleshooting CORS Issues

If you encounter CORS errors after deploying to Netlify, follow these steps:

1. Make sure your Netlify domain is added to Appwrite platforms:
   ```bash
   npm run update:platforms
   ```
   
2. Follow the instructions provided by the script to update your Appwrite platform settings.

3. After updating the platform settings, redeploy your Netlify site or wait a few minutes for the changes to take effect.

## Environment Variables

- `VITE_APPWRITE_ENDPOINT`: Your Appwrite API endpoint
- `VITE_APPWRITE_PROJECT_ID`: Your Appwrite project ID
- `APPWRITE_API_KEY`: Your Appwrite API key (for deployment scripts only, not used in browser)

## License

MIT
