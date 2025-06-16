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

# Create the tmp directory with proper permissions
RUN mkdir -p tmp && chown node:node tmp && chmod 755 tmp

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose the port (defaulting to 3333)
EXPOSE ${PORT:-3333}

# Change user to non-root for security
USER node

# Define the command to run the application
CMD ["node", "build/bin/server.js"]
