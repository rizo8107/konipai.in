# Build stage
FROM node:18-alpine as builder

# Define build arguments
ARG VITE_POCKETBASE_URL
ARG POCKETBASE_ADMIN_EMAIL
ARG POCKETBASE_ADMIN_PASSWORD
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_RAZORPAY_KEY_SECRET
ARG VITE_RAZORPAY_PROXY_URL
ARG VITE_RAZORPAY_PROXY_KEY
ARG VITE_SITE_TITLE
ARG VITE_SITE_LOGO
ARG SMTP_HOST
ARG SMTP_PORT
ARG SMTP_SECURE
ARG SMTP_USER
ARG SMTP_PASSWORD
ARG GIT_SHA

# Set environment variables from build args
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL \
    POCKETBASE_ADMIN_EMAIL=$POCKETBASE_ADMIN_EMAIL \
    POCKETBASE_ADMIN_PASSWORD=$POCKETBASE_ADMIN_PASSWORD \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_RAZORPAY_KEY_SECRET=$VITE_RAZORPAY_KEY_SECRET \
    VITE_RAZORPAY_PROXY_URL=$VITE_RAZORPAY_PROXY_URL \
    VITE_RAZORPAY_PROXY_KEY=$VITE_RAZORPAY_PROXY_KEY \
    VITE_SITE_TITLE=$VITE_SITE_TITLE \
    VITE_SITE_LOGO=$VITE_SITE_LOGO \
    SMTP_HOST=$SMTP_HOST \
    SMTP_PORT=$SMTP_PORT \
    SMTP_SECURE=$SMTP_SECURE \
    SMTP_USER=$SMTP_USER \
    SMTP_PASSWORD=$SMTP_PASSWORD \
    GIT_SHA=$GIT_SHA \
    NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with memory optimizations
RUN npm cache clean --force && \
    npm ci --production=false --no-audit --no-fund

# Copy source code
COPY . .

# Create a .env file with the build arguments
RUN echo "VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL" > .env && \
    echo "VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID" >> .env && \
    echo "VITE_RAZORPAY_PROXY_URL=$VITE_RAZORPAY_PROXY_URL" >> .env && \
    echo "VITE_RAZORPAY_PROXY_KEY=$VITE_RAZORPAY_PROXY_KEY" >> .env && \
    echo "VITE_SITE_TITLE=$VITE_SITE_TITLE" >> .env && \
    echo "VITE_SITE_LOGO=$VITE_SITE_LOGO" >> .env

# Build the application with memory optimizations
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