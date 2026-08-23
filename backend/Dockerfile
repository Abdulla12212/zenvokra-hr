# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build context is ./backend so that Directory.Build.props, Directory.Packages.props,
# and both projects are visible to the restore.
# ---------------------------------------------------------------------------

# --------------------------------- restore ---------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS restore
WORKDIR /src

# Copying only the project files first means a source-only change reuses the cached
# restore layer instead of downloading every package again.
COPY Directory.Build.props Directory.Packages.props ./
COPY src/Cloudesh.Api/Cloudesh.Api.csproj src/Cloudesh.Api/
COPY src/Cloudesh.Application/Cloudesh.Application.csproj src/Cloudesh.Application/

RUN dotnet restore src/Cloudesh.Api/Cloudesh.Api.csproj

# ---------------------------------- build ----------------------------------
FROM restore AS build
COPY src/ src/

RUN dotnet publish src/Cloudesh.Api/Cloudesh.Api.csproj \
    --no-restore \
    --configuration Release \
    --output /app

# ------------------------------ development --------------------------------
# Target used by docker-compose.override.yml. Keeps the SDK so `dotnet watch` and
# `dotnet ef` work, and expects the source to arrive as a bind mount.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS development
WORKDIR /src

RUN dotnet tool install --global dotnet-ef --version 10.0.11
ENV PATH="$PATH:/root/.dotnet/tools" \
    DOTNET_USE_POLLING_FILE_WATCHER=1 \
    ASPNETCORE_HTTP_PORTS=8080

EXPOSE 8080

CMD ["dotnet", "watch", "--project", "src/Cloudesh.Api", "--non-interactive"]

# ------------------------------- production --------------------------------
# Chiseled: no shell, no package manager, and a non-root user by default, which
# removes most of what an attacker would want from a compromised container.
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS production
WORKDIR /app

COPY --from=build /app .

ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080
USER $APP_UID

ENTRYPOINT ["dotnet", "Cloudesh.Api.dll"]
