using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Infrastructure.Persistence;
using DojoFlow.Infrastructure.Persistence.Repositories;
using DojoFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

// Permite guardar DateTime sin zona horaria explícita en columnas timestamptz de PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// SERVICIOS DEL CONTENEDOR
builder.Services.AddControllers();

// CONFIGURACIÓN DE SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// BASE DE DATOS: PostgreSQL vía Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'DefaultConnection'.");

builder.Services.AddDbContext<DojoFlowDbContext>(options =>
    options.UseNpgsql(connectionString));

// INYECCIONES DE DEPENDENCIAS
builder.Services.AddScoped<IAlumnoRepository, EfAlumnoRepository>();
builder.Services.AddScoped<IMensualidadRepository, EfMensualidadRepository>();
builder.Services.AddScoped<IProductoRepository, EfProductoRepository>();
builder.Services.AddScoped<IRegistroFinancieroRepository, EfRegistroFinancieroRepository>();
builder.Services.AddScoped<IUsuarioCoachRepository, EfUsuarioCoachRepository>();
builder.Services.AddScoped<IVerificacionEmailRepository, EfVerificacionEmailRepository>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<RegistrarAlumnoUseCase>();

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
app.UseAuthentication();
app.UseAuthorization();
app.UseDefaultFiles();
app.UseStaticFiles();

// ACTIVAMOS EL CORS AQUÍ (ZONA SEGURA ANTES DE AUTHORIZATION) 🔥
app.UseCors("PermitirTodo");

app.UseAuthorization();

app.MapControllers();

app.Run();
