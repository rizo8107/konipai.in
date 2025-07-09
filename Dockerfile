# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies
RUN npm cache clean --force && \
    npm ci --production=false

# Copy source code
COPY . .

# Define build arguments for environment variables
ARG VITE_POCKETBASE_URL
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_RAZORPAY_KEY_SECRET
ARG VITE_RAZORPAY_PROXY_URL
ARG VITE_RAZORPAY_PROXY_KEY
ARG VITE_CRM_ORDER_ENDPOINT
ARG VITE_SITE_TITLE
ARG VITE_SITE_LOGO
ARG VITE_GOOGLE_MAPS_API_KEY

# Set environment variables
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
ENV VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID}
ENV VITE_RAZORPAY_KEY_SECRET=${VITE_RAZORPAY_KEY_SECRET}
ENV VITE_RAZORPAY_PROXY_URL=${VITE_RAZORPAY_PROXY_URL}
ENV VITE_RAZORPAY_PROXY_KEY=${VITE_RAZORPAY_PROXY_KEY}
ENV VITE_CRM_ORDER_ENDPOINT=${VITE_CRM_ORDER_ENDPOINT}
ENV VITE_SITE_TITLE=${VITE_SITE_TITLE}
ENV VITE_SITE_LOGO=${VITE_SITE_LOGO}
ENV VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 