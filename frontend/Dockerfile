# syntax=docker/dockerfile:1

# ----------------------------------- deps ----------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

# Only the manifests, so a source change does not invalidate the install layer.
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------- build ----------------------------------
FROM deps AS build
WORKDIR /app

# Vite inlines VITE_* variables at build time, so they are build arguments rather
# than runtime environment variables. An empty base URL means same-origin requests,
# which is what the nginx proxy below provides.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ------------------------------ development --------------------------------
# Target used by docker-compose.override.yml. Source arrives as a bind mount and
# node_modules comes from the named volume Docker seeds from this image.
FROM deps AS development
WORKDIR /app

ENV NODE_ENV=development
EXPOSE 5173

CMD ["npm", "run", "dev"]

# ------------------------------- production --------------------------------
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://localhost/ || exit 1
