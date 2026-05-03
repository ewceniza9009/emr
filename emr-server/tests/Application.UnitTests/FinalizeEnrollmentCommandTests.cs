using Application.Common.Interfaces;
using Application.Outreach.Commands;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;
using Xunit;
using Application.Common.Exceptions;

namespace Application.UnitTests.Outreach.Commands;

public class FinalizeEnrollmentCommandTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<IMrnGenerator> _mockMrnGenerator;
    private readonly Mock<IDateTimeProvider> _mockDateTimeProvider;
    private readonly Mock<ILogger<FinalizeEnrollmentCommandHandler>> _mockLogger;
    private readonly FinalizeEnrollmentCommandHandler _handler;

    public FinalizeEnrollmentCommandTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockMrnGenerator = new Mock<IMrnGenerator>();
        _mockDateTimeProvider = new Mock<IDateTimeProvider>();
        _mockLogger = new Mock<ILogger<FinalizeEnrollmentCommandHandler>>();
        
        _handler = new FinalizeEnrollmentCommandHandler(
            _mockContext.Object, 
            _mockMrnGenerator.Object, 
            _mockDateTimeProvider.Object, 
            _mockLogger.Object);
            
        _mockDateTimeProvider.Setup(d => d.UtcNow).Returns(DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Handle_ShouldEnrollPatientSuccessfully()
    {
        // Arrange
        var outreachId = Guid.NewGuid();
        var outreach = new PatientOutreach 
        { 
            PatientOutreachId = outreachId,
            FirstName = "John",
            LastName = "Doe",
            Status = OutreachStatus.Lead
        };

        var command = new FinalizeEnrollmentCommand
        {
            PatientOutreachId = outreachId,
            Modality = "HomeCare",
            HealthPlanId = Guid.NewGuid(),
            Disposition = "Cooperative",
            CommunicationStatus = "Verbal",
            TechAccess = "HighLiteracy"
        };

        var mrn = "MRN12345";
        _mockMrnGenerator.Setup(g => g.GenerateMrnAsync(It.IsAny<CancellationToken>())).ReturnsAsync(mrn);

        var outreaches = new List<PatientOutreach> { outreach }.BuildMockDbSet();
        var patients = new List<Patient>().BuildMockDbSet();

        _mockContext.Setup(c => c.PatientOutreaches).Returns(outreaches.Object);
        _mockContext.Setup(c => c.Patients).Returns(patients.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        outreach.Status.Should().Be(OutreachStatus.Enrolled);
        outreach.EnrolledPatientId.Should().Be(result);
        
        _mockContext.Verify(c => c.Patients.Add(It.IsAny<Patient>()), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrowNotFoundException_WhenOutreachDoesNotExist()
    {
        // Arrange
        var command = new FinalizeEnrollmentCommand { PatientOutreachId = Guid.NewGuid() };
        var outreaches = new List<PatientOutreach>().BuildMockDbSet();
        _mockContext.Setup(c => c.PatientOutreaches).Returns(outreaches.Object);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
    }
}
