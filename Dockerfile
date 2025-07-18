# ===================================
# Stage 1: Build stage
# ===================================
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Run the build command (needs devDependencies)
RUN npm run build

# ===================================
# Stage 2: Production stage
# ===================================
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy other necessary files
COPY --from=builder /app/public ./public

# Copy the start script
COPY start.sh ./
RUN chmod +x start.sh

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/logs && \
    chown -R node:node /app/data /app/logs && \
    chmod 755 /app/data /app/logs

# Set environment variables
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# Expose the port
EXPOSE 3333

# Change user to non-root for security
USER node

# Define the command to run the application
CMD ["./start.sh"]
