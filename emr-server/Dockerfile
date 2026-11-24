# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore
COPY ["emr-server/src/Api/Api.csproj", "emr-server/src/Api/"]
COPY ["emr-server/src/Application/Application.csproj", "emr-server/src/Application/"]
COPY ["emr-server/src/Domain/Domain.csproj", "emr-server/src/Domain/"]
COPY ["emr-server/src/Infrastructure/Infrastructure.csproj", "emr-server/src/Infrastructure/"]
RUN dotnet restore "emr-server/src/Api/Api.csproj"

# Copy everything and publish in a single compilation pass
COPY emr-server/ ./emr-server/
WORKDIR "/src/emr-server/src/Api"
RUN dotnet publish "Api.csproj" -c Release --no-restore -o /app/publish /p:UseAppHost=false /p:PublishReadyToRun=true

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Install dependencies for Npgsql and prepare writable runtime directories for non-root execution
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/logs /app/wwwroot/uploads \
    && chown -R $APP_UID:$APP_UID /app

COPY --chown=$APP_UID:$APP_UID --from=build /app/publish .

# Environment variables
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

USER $APP_UID
EXPOSE 10000
ENTRYPOINT ["dotnet", "Api.dll"]
