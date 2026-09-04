# ==============================================================================
# Stage 1: Build the React + Vite frontend
# ==============================================================================
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Build arguments for Vite environment variables
ARG VITE_API_BASE=http://localhost:6060/api
ENV VITE_API_BASE=${VITE_API_BASE}

# Copy source and build
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Serve static files with Nginx
# ==============================================================================
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
