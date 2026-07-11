FROM node:22-alpine

# Enable community repo (Java, Go etc are there)
RUN sed -i 's/^# *//' /etc/apk/repositories

# Install language runtimes for code execution
RUN apk add --no-cache \
    python3 \
    py3-pip \
    openjdk17-jdk \
    gcc \
    g++

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH="$JAVA_HOME/bin:$PATH"

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm prune --omit=dev
EXPOSE 4000
CMD ["node", "dist/index.js"]
