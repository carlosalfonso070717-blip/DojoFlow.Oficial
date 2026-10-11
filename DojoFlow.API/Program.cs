using DojoFlow.API.Services;
using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Academias;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Domain.Entities;
using DojoFlow.Infrastructure.Persistence;
using DojoFlow.Infrastructure.Persistence.Repositories;
using DojoFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

// Permite guardar DateTime sin zona horaria explícita en columnas timestamptz de PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// SERVICIOS DEL CONTENEDOR
builder.Services.AddControllers()
    // Los enums viajan como texto ("Paquete", "PorClase") en lugar de números
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// CONFIGURACIÓN DE SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// BASE DE DATOS: PostgreSQL vía Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'DefaultConnection'.");

builder.Services.AddDbContext<DojoFlowDbContext>(options =>
    options.UseNpgsql(connectionString));

// MULTI-ACADEMIA: la academia de cada petición sale del JWT
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContextHttp>();
builder.Services.AddSingleton<GeneradorTokens>();

// INYECCIONES DE DEPENDENCIAS
builder.Services.AddScoped<IAcademiaRepository, EfAcademiaRepository>();
builder.Services.AddScoped<IClaseRepository, EfClaseRepository>();
builder.Services.AddScoped<IAlumnoRepository, EfAlumnoRepository>();
builder.Services.AddScoped<IMensualidadRepository, EfMensualidadRepository>();
builder.Services.AddScoped<IProductoRepository, EfProductoRepository>();
builder.Services.AddScoped<IRegistroFinancieroRepository, EfRegistroFinancieroRepository>();
builder.Services.AddScoped<IUsuarioCoachRepository, EfUsuarioCoachRepository>();
builder.Services.AddScoped<IVerificacionEmailRepository, EfVerificacionEmailRepository>();
// En desarrollo sin llave de Brevo los correos van al log; en producción siempre se usa Brevo
var brevoSinConfigurar = string.IsNullOrWhiteSpace(builder.Configuration["Brevo:ApiKey"])
    || builder.Configuration["Brevo:ApiKey"]!.StartsWith("TU_");
if (builder.Environment.IsDevelopment() && brevoSinConfigurar)
    builder.Services.AddSingleton<IEmailSender, ConsolaEmailSender>();
else
    builder.Services.AddHttpClient<IEmailSender, BrevoEmailSender>();
builder.Services.AddScoped<RegistrarAlumnoUseCase>();
builder.Services.AddScoped<RegistrarAcademiaUseCase>();

// RECUPERAMOS LA POLÍTICA DE CORS AQUÍ
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configuración de JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Un [Authorize] sin roles solo deja pasar a usuarios del panel, nunca al token del kiosco
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireRole(Roles.Dueno, Roles.Coach)
        .Build();
});

var app = builder.Build();

// Aplica las migraciones pendientes al arrancar (crea/actualiza tablas, incluye datos semilla)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DojoFlowDbContext>();
    db.Database.Migrate();
}

// PIPELINE DE SOLICITUDES HTTP Y PERSONALIZACIÓN VISUAL
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.InjectStylesheet("/swagger-ui/custom.css");
        c.DocumentTitle = "API Dominio Combat Club";
    });
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("PermitirTodo");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
