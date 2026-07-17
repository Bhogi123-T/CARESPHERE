# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application for production
# Ensure we pass the production env variables during build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve the application using NGINX
FROM nginx:alpine

# Copy the built application from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add custom NGINX configuration for React Router (SPA fallback to index.html)
RUN echo 'server { \
    listen 80; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
