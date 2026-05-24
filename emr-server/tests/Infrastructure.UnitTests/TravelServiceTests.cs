using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using Xunit;

namespace Infrastructure.UnitTests;

public class TravelServiceTests
{
    private readonly Mock<IDbContextFactory<ApplicationDbContext>> _mockDbFactory;
    private readonly Mock<IHttpClientFactory> _mockHttpClientFactory;
    private readonly Mock<ILogger<TravelService>> _mockLogger;

    public TravelServiceTests()
    {
        _mockDbFactory = new Mock<IDbContextFactory<ApplicationDbContext>>();
        _mockHttpClientFactory = new Mock<IHttpClientFactory>();
        _mockLogger = new Mock<ILogger<TravelService>>();
    }

    [Fact]
    public async Task GetDistanceAndDurationAsync_ShouldReturnOSRMValues_WhenAPIRespondsSuccessfully()
    {
        // Arrange
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{\"code\":\"Ok\",\"routes\":[{\"distance\":1609.344,\"duration\":60.0}]}")
            });

        var client = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri("http://router.project-osrm.org/")
        };

        _mockHttpClientFactory.Setup(f => f.CreateClient("OSRM")).Returns(client);

        var service = new TravelService(
            _mockDbFactory.Object,
            _mockHttpClientFactory.Object,
            _mockLogger.Object
        );

        // Act
        // 1609.344 meters is exactly 1.0 mile. 60.0 seconds is exactly 1.0 minute.
        var (distance, duration) = await service.GetDistanceAndDurationAsync(10.0, 10.0, 10.1, 10.1, CancellationToken.None);

        // Assert
        distance.Should().BeApproximately(1.0, 0.01);
        duration.Should().BeApproximately(1.0, 0.01);

        handlerMock.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req =>
                req.Method == HttpMethod.Get &&
                req.RequestUri.ToString().Contains("route/v1/driving/10,10;10.1,10.1")
            ),
            ItExpr.IsAny<CancellationToken>()
        );
    }

    [Fact]
    public async Task GetDistanceAndDurationAsync_ShouldFallbackToHaversine_WhenAPIResponseIsError()
    {
        // Arrange
        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.InternalServerError
            });

        var client = new HttpClient(handlerMock.Object)
        {
            BaseAddress = new Uri("http://router.project-osrm.org/")
        };

        _mockHttpClientFactory.Setup(f => f.CreateClient("OSRM")).Returns(client);

        var service = new TravelService(
            _mockDbFactory.Object,
            _mockHttpClientFactory.Object,
            _mockLogger.Object
        );

        // Act
        var (distance, duration) = await service.GetDistanceAndDurationAsync(10.0, 10.0, 10.1, 10.1, CancellationToken.None);

        // Assert
        distance.Should().BeGreaterThan(0);
        duration.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetDistanceAndDurationAsync_ShouldFallbackToHaversine_WhenAPIThrows()
    {
        // Arrange
        _mockHttpClientFactory.Setup(f => f.CreateClient("OSRM")).Throws(new HttpRequestException("Network failure"));

        var service = new TravelService(
            _mockDbFactory.Object,
            _mockHttpClientFactory.Object,
            _mockLogger.Object
        );

        // Act
        var (distance, duration) = await service.GetDistanceAndDurationAsync(10.0, 10.0, 10.1, 10.1, CancellationToken.None);

        // Assert
        distance.Should().BeGreaterThan(0);
        duration.Should().BeGreaterThan(0);
    }
}
