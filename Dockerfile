# Web: la app de mobile/ compilada para navegador (misma app que en el celular)
FROM node:24-slim AS web
WORKDIR /mobile
COPY mobile/package.json mobile/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY mobile/ ./
# En la web la API está en el mismo dominio
ENV EXPO_PUBLIC_API_URL=/api
# Client ID web de Google (OAuth) para "Continuar con Google"; vacío = el botón no aparece
ARG GOOGLE_WEB_CLIENT_ID=""
ENV EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$GOOGLE_WEB_CLIENT_ID
RUN npx expo export --platform web --output-dir /web
# En modo SPA Expo genera index.html en inglés: la app es en español
RUN sed -i 's/<html lang="en"/<html lang="es"/' /web/index.html

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DojoFlow.API/DojoFlow.API.csproj DojoFlow.API/
COPY DojoFlow.Application/DojoFlow.Application.csproj DojoFlow.Application/
COPY DojoFlow.Domain/DojoFlow.Domain.csproj DojoFlow.Domain/
COPY DojoFlow.Infrastructure/DojoFlow.Infrastructure.csproj DojoFlow.Infrastructure/
RUN dotnet restore DojoFlow.API/DojoFlow.API.csproj

COPY DojoFlow.API/ DojoFlow.API/
COPY DojoFlow.Application/ DojoFlow.Application/
COPY DojoFlow.Domain/ DojoFlow.Domain/
COPY DojoFlow.Infrastructure/ DojoFlow.Infrastructure/
COPY frontend/ frontend/

RUN dotnet publish DojoFlow.API/DojoFlow.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=web /web ./wwwroot

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DojoFlow.API.dll"]
