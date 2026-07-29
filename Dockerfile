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

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DojoFlow.API.dll"]
