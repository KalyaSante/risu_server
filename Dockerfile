# Use an official Node.js LTS image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Run the build command
RUN npm run build

# Create the tmp directory
# Grant write permissions to the node user for the tmp directory and its contents
RUN mkdir tmp && chown node:node tmp && chmod 755 tmp

# Set NODE_ENV to production
ENV NODE_ENV production

# Expose the port (defaulting to 3333)
EXPOSE ${PORT:-3333}

# Change user to non-root
USER node

# Define the command to run the application
CMD ["node", "bin/server.js"]
