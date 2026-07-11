FROM node:22-alpine

# Install language runtimes for code execution
RUN apk add --no-cache \
    python3 \
    py3-pip \
    openjdk21-jdk \
    gcc \
    g++ \
    go \
    rust \
    cargo

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm prune --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
