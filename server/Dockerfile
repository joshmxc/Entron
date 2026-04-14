FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy server package
COPY server/package.json ./server/

# Install all deps
RUN npm install --include=dev

# Generate Prisma client
RUN npx prisma generate

# Copy server source and build
COPY server/src ./server/src
COPY server/tsconfig.json ./server/

RUN npm run build -w server

# Run migrations and start
EXPOSE 8080
CMD npx prisma migrate deploy && node server/dist/index.js
