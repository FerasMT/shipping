# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Copy the .env file
COPY .env .env

# Generate Prisma client
RUN npx prisma generate

# Copy remaining files and build
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app

# Copy just production dependencies
COPY package*.json ./
RUN npm install --production

# Copy .env so Prisma can access DATABASE_URL
COPY .env .env

# Copy build output & prisma schema from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client again in the final environment
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
