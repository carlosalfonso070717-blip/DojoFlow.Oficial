using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Infrastructure.Persistence.Repositories;

var builder = WebApplication.CreateBuilder(args);

// SERVICIOS DEL CONTENEDOR
builder.Services.AddControllers();

// CONFIGURACIÓN DE SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// INYECCIONES DE DEPENDENCIAS
builder.Services.AddSingleton<IAlumnoRepository, InMemoryAlumnoRepository>();
builder.Services.AddScoped<RegistrarAlumnoUseCase>();

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

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();