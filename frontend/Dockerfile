FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Run the application in development mode
CMD ["npm", "run", "dev"]