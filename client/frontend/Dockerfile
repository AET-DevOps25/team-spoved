# stage1 as builder
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy only package files to leverage Docker cache
COPY package.json package-lock.json* ./

# Copy source code (after dependencies are installed)
COPY public ./public
COPY src ./src
# add *.mts so vite.config.mts is included
COPY *.json *.ts *.mts *.js *.html ./

ARG VITE_TICKET_API_URL
ARG VITE_USER_API_URL
ARG VITE_MEDIA_API_URL
ARG VITE_AUTH_API_URL
ARG VITE_GENAI_API_URL


ENV VITE_TICKET_API_URL=$VITE_TICKET_API_URL
ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV VITE_MEDIA_API_URL=$VITE_MEDIA_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_GENAI_API_URL=$VITE_GENAI_API_URL

ENV NODE_ENV=dev

# Clear npm cache and install dependencies
RUN npm cache clean --force

# Install dependencies
RUN npm install

# Run tests
RUN npm test

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