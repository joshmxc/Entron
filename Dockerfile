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
# Replace TS-compiled prisma (broken ESM/CJS mix) with original generated client
RUN rm -rf server/dist/generated && cp -r generated server/dist/generated

EXPOSE 8080
CMD node server/dist/server/src/index.js
