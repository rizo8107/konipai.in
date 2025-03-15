# Konipai Tote Bag Hub

A modern e-commerce platform for tote bags built with React, TypeScript, and PocketBase.

## Features

- User authentication and profile management
- Product browsing and filtering
- Shopping cart functionality
- Order processing and history
- Address management
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: PocketBase (Authentication, Database, File Storage)
- **Deployment**: Netlify

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PocketBase (Download from https://pocketbase.io/docs/)

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

3. Create a `.env` file based on `.env.example` and fill in your PocketBase credentials:
   ```
   VITE_POCKETBASE_URL=http://127.0.0.1:8090
   POCKETBASE_ADMIN_EMAIL=your-admin-email
   POCKETBASE_ADMIN_PASSWORD=your-admin-password
   ```

4. Start PocketBase:
   ```bash
   # Navigate to your PocketBase directory
   ./pocketbase serve
   ```

5. Initialize PocketBase collections:
   ```bash
   npm run init:pocketbase
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## PocketBase Setup

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract the executable and run it:
   ```bash
   ./pocketbase serve
   ```
3. Access the admin UI at http://127.0.0.1:8090/_/
4. Create an admin account with the credentials specified in your `.env` file
5. Run the initialization script to create collections:
   ```bash
   npm run init:pocketbase
   ```

The script will create the following collections:
- `users` (built-in PocketBase users collection)
- `products`: For storing product information
- `orders`: For storing order information
- `addresses`: For storing user addresses

## Collection Structure

### Products Collection
- name (text, required)
- description (text, required)
- price (number, required)
- images (file[], required)
- colors (json, required)
- features (text[], required)
- dimensions (text, required)
- material (text, required)
- care (text[], required)
- category (text, required)
- tags (text[], required)
- bestseller (bool, required)
- new (bool, required)
- inStock (bool, required)
- reviews (number, optional)

### Orders Collection
- user (relation to users, required)
- products (json, required)
- totalAmount (number, required)
- status (select: pending/processing/shipped/delivered/cancelled, required)
- shippingAddress (relation to addresses, required)

### Addresses Collection
- user (relation to users, required)
- street (text, required)
- city (text, required)
- state (text, required)
- postalCode (text, required)
- country (text, required)
- isDefault (bool, required)

## Deployment

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to Netlify using the Netlify CLI or drag-and-drop interface.

3. Deploy PocketBase to your preferred hosting provider (e.g., DigitalOcean, AWS, etc.)

### Environment Variables for Production

Make sure to set the following environment variables in your production environment:

- `VITE_POCKETBASE_URL`: Your PocketBase server URL
- `POCKETBASE_ADMIN_EMAIL`: Admin email for PocketBase
- `POCKETBASE_ADMIN_PASSWORD`: Admin password for PocketBase

## License

MIT
