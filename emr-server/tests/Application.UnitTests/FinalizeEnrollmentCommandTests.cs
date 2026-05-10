using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Application.Outreach.Commands;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;
using Xunit;

namespace Application.UnitTests.Outreach.Commands;

public class FinalizeEnrollmentCommandTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<IMrnGenerator> _mockMrnGenerator;
    private readonly Mock<IDateTimeProvider> _mockDateTimeProvider;
    private readonly Mock<ISchedulingService> _mockSchedulingService;
    private readonly Mock<ILogger<FinalizeEnrollmentCommandHandler>> _mockLogger;
    private readonly FinalizeEnrollmentCommandHandler _handler;

    public FinalizeEnrollmentCommandTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockMrnGenerator = new Mock<IMrnGenerator>();
        _mockDateTimeProvider = new Mock<IDateTimeProvider>();
        _mockSchedulingService = new Mock<ISchedulingService>();
        _mockLogger = new Mock<ILogger<FinalizeEnrollmentCommandHandler>>();

        _handler = new FinalizeEnrollmentCommandHandler(
            _mockContext.Object,
            _mockMrnGenerator.Object,
            _mockDateTimeProvider.Object,
            _mockSchedulingService.Object,
            _mockLogger.Object
        );

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
            Status = OutreachStatus.Lead,
        };

        var command = new FinalizeEnrollmentCommand
        {
            PatientOutreachId = outreachId,
            Modality = "HomeCare",
            HealthPlanId = Guid.NewGuid(),
            Disposition = "Cooperative",
            CommunicationStatus = "Verbal",
            TechAccess = "HighLiteracy",
            ConsentToTreat = true,
            ConsentHIPAA = true,
            HasPoa = true,
            HasAdvanceDirective = false,
            PreferredContactMethod = "PHONE"
        };

        var mrn = "MRN12345";
        _mockMrnGenerator
            .Setup(g => g.GenerateMrnAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(mrn);

        var outreaches = new List<PatientOutreach> { outreach }.BuildMockDbSet();
        var patients = new List<Patient>();
        var mockPatients = patients.BuildMockDbSet();
        
        var practitioners = new List<Practitioner>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase>().BuildMockDbSet();
        var navTasks = new List<NavigationTask>().BuildMockDbSet();

        _mockContext.Setup(c => c.PatientOutreaches).Returns(outreaches.Object);
        _mockContext.Setup(c => c.Patients).Returns(mockPatients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);
        _mockContext.Setup(c => c.NavigationTasks).Returns(navTasks.Object);

        // Capture the added patient
        Patient? capturedPatient = null;
        _mockContext.Setup(c => c.Patients.Add(It.IsAny<Patient>()))
            .Callback<Patient>(p => capturedPatient = p);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        outreach.Status.Should().Be(OutreachStatus.Enrolled);
        outreach.EnrolledPatientId.Should().Be(result);

        capturedPatient.Should().NotBeNull();
        capturedPatient!.ConsentToTreat.Should().BeTrue();
        capturedPatient!.ConsentHIPAA.Should().BeTrue();
        capturedPatient!.HasPoa.Should().BeTrue();
        capturedPatient!.HasAdvanceDirective.Should().BeFalse();
        capturedPatient!.PreferredContactMethod.Should().Be("PHONE");

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
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
