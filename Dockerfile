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

# Set memory limit and build the application using EasyPanel-specific build script
# Use the nopre version to bypass the prebuild step that optimizes images
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV SKIP_IMAGE_OPTIMIZATION="true"
RUN npm run build:easypanel:nopre

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