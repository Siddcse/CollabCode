FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm prune --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
