# Use an official Node.js image as the base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN npm install

# Copy source files
COPY . .

# Expose port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
