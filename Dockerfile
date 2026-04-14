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
# The TS compiler mangles the generated prisma client — replace with originals
RUN rm -rf server/dist/generated && mkdir -p server/dist/generated && cp -r generated/prisma server/dist/generated/prisma

EXPOSE 8080
CMD node server/dist/server/src/index.js
