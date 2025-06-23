# stage1 as builder
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy only package files to leverage Docker cache
COPY package.json package-lock.json* ./
RUN npm install
# Copy source code (after dependencies are installed)
COPY public ./public
COPY src ./src
COPY *.json *.ts *.js *.html ./

ARG VITE_SERVER_API_URL
ENV VITE_SERVER_API_URL=$VITE_SERVER_API_URL


# Build the project
RUN npm run build

# Production stage
FROM nginx:alpine AS production-build
RUN addgroup -S vite && adduser -S vite -G vite
RUN mkdir -p /var/cache/nginx/ /var/run/nginx \
    && chown -R vite:vite /var/cache/nginx /var/run/nginx
COPY nginx.conf /etc/nginx/nginx.conf
# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*
# Copy from the build stage
COPY --chown=vite:vite --from=builder /app/dist /workspace/build
EXPOSE 3000
USER vite
ENTRYPOINT ["nginx", "-g", "daemon off;"]