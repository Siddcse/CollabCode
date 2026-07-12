FROM node:22-alpine

# Enable community repo (Java packages are there)
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

# Copy workspace root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY backend/package*.json ./backend/

# Install all workspace dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY packages/shared/ ./packages/shared/
COPY backend/ ./backend/

# Build shared first, then backend
RUN npm run build --workspace=packages/shared || true
RUN npm run build --workspace=backend

# Prune dev deps
RUN npm prune --omit=dev

EXPOSE 4000
CMD ["npm", "start", "--workspace=backend"]
