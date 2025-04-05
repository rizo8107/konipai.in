# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies using modern syntax
RUN npm cache clean --force && \
    npm ci --omit=prod

# Copy source code
COPY . .

# Build the application using EasyPanel-specific build script
RUN npm run build:easypanel

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