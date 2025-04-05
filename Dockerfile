# Build stage optimized for EasyPanel
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
    NODE_OPTIONS="--max-old-space-size=768" \
    NODE_ENV=production

# Set working directory
WORKDIR /app

# Install dependencies required for Sharp image processing
RUN apk add --no-cache python3 make g++

# Copy package files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies with memory-saving options - ensure sharp is installed
RUN npm config set loglevel error && \
    npm config set progress false && \
    npm ci --prefer-offline --no-audit --no-fund && \
    npm install sharp && \
    npm cache clean --force

# Copy source code
COPY . .

# Create .env file explicitly
RUN echo "VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL" > .env && \
    echo "VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID" >> .env && \
    echo "VITE_RAZORPAY_PROXY_URL=$VITE_RAZORPAY_PROXY_URL" >> .env && \
    echo "VITE_RAZORPAY_PROXY_KEY=$VITE_RAZORPAY_PROXY_KEY" >> .env && \
    echo "VITE_SITE_TITLE=$VITE_SITE_TITLE" >> .env && \
    echo "VITE_SITE_LOGO=$VITE_SITE_LOGO" >> .env

# Build with memory optimizations - directly use npx vite build
RUN NODE_OPTIONS="--max-old-space-size=768" npx vite build

# Production stage
FROM nginx:alpine

# Copy only the built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]