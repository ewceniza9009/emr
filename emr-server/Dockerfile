# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore
COPY ["emr-server/src/Api/Api.csproj", "emr-server/src/Api/"]
COPY ["emr-server/src/Application/Application.csproj", "emr-server/src/Application/"]
COPY ["emr-server/src/Domain/Domain.csproj", "emr-server/src/Domain/"]
COPY ["emr-server/src/Infrastructure/Infrastructure.csproj", "emr-server/src/Infrastructure/"]
RUN dotnet restore "emr-server/src/Api/Api.csproj"

# Copy everything and build
COPY emr-server/ ./emr-server/
WORKDIR "/src/emr-server/src/Api"
RUN dotnet build "Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Install dependencies for Npgsql
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

# Environment variables
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000
ENTRYPOINT ["dotnet", "Api.dll"]
