FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY server/package.json ./server/
COPY server/tsconfig.json ./server/
COPY server/src ./server/src

RUN npm install --include=dev
RUN npx prisma generate
RUN npm run build -w server
RUN npx prisma migrate deploy

EXPOSE 8080
CMD ["node", "server/dist/index.js"]
