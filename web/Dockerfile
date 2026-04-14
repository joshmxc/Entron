FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy web package and source
COPY web/package.json ./web/
COPY web/src ./web/src
COPY web/public ./web/public
COPY web/next.config.ts ./web/
COPY web/tailwind.config.ts ./web/
COPY web/postcss.config.js ./web/
COPY web/tsconfig.json ./web/
COPY messages ./messages

# Install deps
RUN npm install --include=dev

# Build
RUN npm run build -w web

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "web"]
