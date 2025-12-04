# Use Node.js LTS (Long Term Support) version
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies (only production)
RUN npm install

# Copy source code
COPY . .

# Build the app (client & server)
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables (should be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=5000

# Command to run the app
CMD ["npm", "start"]
