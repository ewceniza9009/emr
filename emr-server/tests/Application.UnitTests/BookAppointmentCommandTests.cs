using Application.Appointments.Commands;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Storage;
using MockQueryable.Moq;
using Moq;

namespace Application.UnitTests.Appointments.Commands;

public class BookAppointmentCommandTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<ISchedulingService> _mockSchedulingService;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly BookAppointmentCommandHandler _handler;

    public BookAppointmentCommandTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockSchedulingService = new Mock<ISchedulingService>();
        _mockNotificationService = new Mock<INotificationService>();
        _handler = new BookAppointmentCommandHandler(
            _mockContext.Object,
            _mockSchedulingService.Object,
            _mockNotificationService.Object
        );

        // Default successful logistics setups
        _mockSchedulingService
            .Setup(s =>
                s.RecalculateAppointmentStatsAsync(
                    It.IsAny<Appointment>(),
                    It.IsAny<CancellationToken>()
                )
            )
            .ReturnsAsync((0.0, 0.0));

        _mockSchedulingService
            .Setup(s =>
                s.ValidateLogisticsAsync(It.IsAny<Appointment>(), It.IsAny<CancellationToken>())
            )
            .ReturnsAsync((true, null));

        var mockTransaction = new Mock<IDbContextTransaction>();
        _mockContext
            .Setup(c => c.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockTransaction.Object);
    }

    [Fact]
    public async Task Handle_ShouldCreateNewAppointment_WhenIdIsEmpty()
    {
        // Arrange
        var command = new BookAppointmentCommand(
            PatientId: Guid.NewGuid(),
            PractitionerId: Guid.NewGuid(),
            SupportingPractitionerIds: new List<Guid>(),
            ScheduledStart: DateTimeOffset.Now.AddDays(1),
            ScheduledEnd: DateTimeOffset.Now.AddDays(1).AddHours(1),
            Modality: AppointmentModality.InPersonHomeVisit
        );

        var practitioners = new List<Practitioner>().BuildMockDbSet();
        var appointments = new List<Appointment>().BuildMockDbSet();
        var patients = new List<Patient> { 
            new Patient { PatientId = command.PatientId, FirstName = "Test", LastName = "Patient" } 
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);
        _mockContext.Setup(c => c.Patients).Returns(patients.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Appointment.Should().NotBeNull();
        result.Appointment.PatientId.Should().Be(command.PatientId);
        result.Appointment.PractitionerId.Should().Be(command.PractitionerId);
        _mockContext.Verify(c => c.Appointments.Add(It.IsAny<Appointment>()), Times.Once);
        _mockContext.Verify(
            c => c.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.AtLeastOnce()
        );
    }

    [Fact]
    public async Task Handle_ShouldUpdateExistingAppointment_WhenIdIsProvided()
    {
        // Arrange
        var appointmentId = Guid.NewGuid();
        var existingAppointment = new Appointment
        {
            AppointmentId = appointmentId,
            PatientId = Guid.NewGuid(),
            PractitionerId = Guid.NewGuid(),
        };

        var command = new BookAppointmentCommand(
            PatientId: Guid.NewGuid(),
            PractitionerId: Guid.NewGuid(),
            SupportingPractitionerIds: new List<Guid>(),
            ScheduledStart: DateTimeOffset.Now.AddDays(1),
            ScheduledEnd: DateTimeOffset.Now.AddDays(1).AddHours(1),
            Modality: AppointmentModality.TelehealthVideo,
            AppointmentId: appointmentId
        );

        var practitioners = new List<Practitioner>().BuildMockDbSet();
        var appointments = new List<Appointment> { existingAppointment }.BuildMockDbSet();
        var patients = new List<Patient> { 
            new Patient { PatientId = command.PatientId, FirstName = "Test", LastName = "Patient" } 
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);
        _mockContext.Setup(c => c.Patients).Returns(patients.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Appointment.Should().NotBeNull();
        result.Appointment.AppointmentId.Should().Be(appointmentId);
        result.Appointment.PatientId.Should().Be(command.PatientId); // Updated
        _mockContext.Verify(c => c.Appointments.Add(It.IsAny<Appointment>()), Times.Never);
        _mockContext.Verify(
            c => c.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.AtLeastOnce()
        );
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAppointmentNotFound()
    {
        // Arrange
        var command = new BookAppointmentCommand(
            PatientId: Guid.NewGuid(),
            PractitionerId: Guid.NewGuid(),
            SupportingPractitionerIds: new List<Guid>(),
            ScheduledStart: DateTimeOffset.Now.AddDays(1),
            ScheduledEnd: DateTimeOffset.Now.AddDays(1).AddHours(1),
            Modality: AppointmentModality.TelehealthVideo,
            AppointmentId: Guid.NewGuid() // Non-existent
        );

        var practitioners = new List<Practitioner>().BuildMockDbSet();
        var appointments = new List<Appointment>().BuildMockDbSet();
        var patients = new List<Patient>().BuildMockDbSet();

        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);
        _mockContext.Setup(c => c.Patients).Returns(patients.Object);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }
}
