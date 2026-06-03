using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Le decimos al sistema: "Cuando alguien pida un IAlumnoRepository, dale el InMemoryAlumnoRepository"
builder.Services.AddSingleton<IAlumnoRepository, InMemoryAlumnoRepository>();

// Registramos el Caso de Uso para que el Controlador pueda usarlo
builder.Services.AddScoped<RegistrarAlumnoUseCase>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
