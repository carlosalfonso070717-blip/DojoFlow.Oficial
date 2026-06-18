using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// 1. CONFIGURACIÓN DE SWAGGER (Reemplaza a AddOpenApi)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. TUS INYECCIONES DE DEPENDENCIAS (Intactas para que nada se rompa)
// Le decimos al sistema: "Cuando alguien pida un IAlumnoRepository, dale el InMemoryAlumnoRepository"
builder.Services.AddSingleton<IAlumnoRepository, InMemoryAlumnoRepository>();

// Registramos el Caso de Uso para que el Controlador pueda usarlo
builder.Services.AddScoped<RegistrarAlumnoUseCase>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // 3. ACTIVAR LA INTERFAZ GRÁFICA DE SWAGGER (Reemplaza a MapOpenApi)
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();