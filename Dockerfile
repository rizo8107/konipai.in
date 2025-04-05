# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with memory optimizations
RUN npm cache clean --force && \
    npm ci --production=false --no-audit --no-fund

# Copy source code (excluding large files and directories not needed for build)
COPY . .

# Build the application with memory optimizations
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN node docker-build.js

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