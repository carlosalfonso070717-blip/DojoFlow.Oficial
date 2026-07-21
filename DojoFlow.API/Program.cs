using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// SERVICIOS DEL CONTENEDOR
builder.Services.AddControllers();

// CONFIGURACIÓN DE SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// INYECCIONES DE DEPENDENCIAS
builder.Services.AddSingleton<IAlumnoRepository, InMemoryAlumnoRepository>();
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

var app = builder.Build();

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
app.UseStaticFiles();

// ACTIVAMOS EL CORS AQUÍ (ZONA SEGURA ANTES DE AUTHORIZATION) 🔥
app.UseCors("PermitirTodo");

app.UseAuthorization();

app.MapControllers();

app.Run();