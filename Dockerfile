# syntax=docker/dockerfile:1

# Render (and `make build-deploy`) build this file from the repo root. The
# resulting image is one origin: Kestrel serves the Vite build from wwwroot
# and the API from /api, so the session cookie never crosses a site boundary.

# -------------------------------- frontend ---------------------------------
FROM node:24-alpine AS frontend
WORKDIR /web

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --------------------------------- restore ---------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

COPY backend/Directory.Build.props backend/Directory.Packages.props ./
COPY backend/src/Cloudesh.Api/Cloudesh.Api.csproj src/Cloudesh.Api/
COPY backend/src/Cloudesh.Application/Cloudesh.Application.csproj src/Cloudesh.Application/

RUN dotnet restore src/Cloudesh.Api/Cloudesh.Api.csproj

# ---------------------------------- build ----------------------------------
FROM restore AS build
COPY backend/src/ src/

RUN dotnet publish src/Cloudesh.Api/Cloudesh.Api.csproj \
    --no-restore \
    --configuration Release \
    --output /app

# ------------------------------- production --------------------------------
# Chiseled: no shell, so Render cannot run a pre-deploy command in this image.
# Migrations run from application startup (Database__MigrateOnStartup) instead.
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS production
WORKDIR /app

COPY --from=build /app .
COPY --from=frontend /web/dist ./wwwroot

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080
USER $APP_UID

ENTRYPOINT ["dotnet", "Cloudesh.Api.dll"]
