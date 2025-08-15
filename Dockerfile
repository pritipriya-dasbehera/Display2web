# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Set environment variables for production
ENV NODE_ENV=production

# Expose the app port (default 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
