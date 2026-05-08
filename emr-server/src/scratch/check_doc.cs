using Microsoft.EntityFrameworkCore;
using Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Application.Common.Interfaces;
using Moq;

var services = new ServiceCollection();
var configuration = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json", optional: true)
    .AddEnvironmentVariables()
    .Build();

services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

services.AddScoped<ICurrentUserService>(sp => Mock.Of<ICurrentUserService>(u => u.TenantId == Guid.Empty));

var serviceProvider = services.BuildServiceProvider();
using var scope = serviceProvider.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

var docId = Guid.Parse("5929167e-f473-4db4-a20e-310d2e19d21f");
var doc = await context.PatientDocuments
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(d => d.PatientDocumentId == docId);

if (doc == null)
{
    Console.WriteLine("Document NOT FOUND in database.");
}
else
{
    Console.WriteLine($"Document Found: {doc.Title}");
    Console.WriteLine($"Storage URL: {doc.StorageUrl}");
    Console.WriteLine($"Tenant ID: {doc.TenantId}");
}
