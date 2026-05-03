using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MockQueryable.Moq;
using Xunit;

namespace Infrastructure.UnitTests;

public class SchedulingServiceTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<ILogger<SchedulingService>> _mockLogger;
    private readonly SchedulingService _service;

    public SchedulingServiceTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockLogger = new Mock<ILogger<SchedulingService>>();
        _service = new SchedulingService(_mockContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipProvidersWithoutShifts()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero); // Monday
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner> { 
            new Practitioner { PractitionerId = Guid.NewGuid(), LastName = "NoShift", IsActive = true, IsCareNavigator = true } 
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift>().BuildMockDbSet();
        var appointments = new List<Appointment>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldReturnSlot_WhenProviderIsAvailable()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero); // Monday
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { 
            new Patient { 
                PatientId = patientId,
                Addresses = new List<EntityAddress> { 
                    new EntityAddress { IsPrimary = true, Address = new Address { Latitude = 10, Longitude = 10 } } 
                }
            } 
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner> { 
            new Practitioner { 
                PractitionerId = practitionerId, 
                LastName = "Available", 
                IsActive = true, 
                IsCareNavigator = true,
                Addresses = new List<EntityAddress> { 
                    new EntityAddress { IsPrimary = true, Address = new Address { Latitude = 10.1, Longitude = 10.1 } } 
                }
            } 
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift> { 
            new ProviderShift { 
                PractitionerId = practitionerId, 
                DayOfWeek = DayOfWeek.Monday, 
                StartTime = new TimeSpan(8, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0) 
            } 
        }.BuildMockDbSet();

        var appointments = new List<Appointment>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        result.Should().NotBeEmpty();
        result.Any(s => s.PractitionerId == practitionerId).Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipSlot_WhenThereIsAConflict()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero); // Monday 10:00
        var duration = TimeSpan.FromHours(1); // 10:00 - 11:00
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();

        var practitioners = new List<Practitioner> { 
            new Practitioner { PractitionerId = practitionerId, LastName = "Busy", IsActive = true, IsCareNavigator = true } 
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift> { 
            new ProviderShift { 
                PractitionerId = practitionerId, 
                DayOfWeek = DayOfWeek.Monday, 
                StartTime = new TimeSpan(8, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0) 
            } 
        }.BuildMockDbSet();

        // Existing appointment from 10:30 to 11:30 (overlaps with 10:00-11:00)
        var appointments = new List<Appointment> { 
            new Appointment { 
                PractitionerId = practitionerId, 
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 10, 30, 0, TimeSpan.Zero), 
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 11, 30, 0, TimeSpan.Zero) 
            } 
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        // The slot at 10:00 should be filtered out because it overlaps with the 10:30 appointment.
        result.Any(s => s.StartTime == targetStart).Should().BeFalse();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldAccountForTravelTimeFromPreviousAppointment()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero); // Monday 10:00
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { 
            new Patient { 
                PatientId = patientId,
                Addresses = new List<EntityAddress> { 
                    new EntityAddress { IsPrimary = true, Address = new Address { Latitude = 10, Longitude = 10 } } 
                }
            } 
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner> { 
            new Practitioner { 
                PractitionerId = practitionerId, 
                LastName = "Traveler", 
                IsActive = true, 
                IsCareNavigator = true,
                Addresses = new List<EntityAddress> { 
                    new EntityAddress { IsPrimary = true, Address = new Address { Latitude = 40, Longitude = 40 } } // Far away
                }
            } 
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift> { 
            new ProviderShift { 
                PractitionerId = practitionerId, 
                DayOfWeek = DayOfWeek.Monday, 
                StartTime = new TimeSpan(8, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0) 
            } 
        }.BuildMockDbSet();

        // Previous appointment ends at 09:30. 
        // We need to see if it allows a 10:00 appointment if travel time is say 45 mins.
        // If travel time > 30 mins, 10:00 should be unavailable.
        var anchorPatientId = Guid.NewGuid();
        var appointments = new List<Appointment> { 
            new Appointment { 
                PractitionerId = practitionerId, 
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 8, 30, 0, TimeSpan.Zero), 
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 9, 30, 0, TimeSpan.Zero),
                Patient = new Patient {
                    PatientId = anchorPatientId,
                    Addresses = new List<EntityAddress> {
                        new EntityAddress { IsPrimary = true, Address = new Address { Latitude = 10.1, Longitude = 10.1 } } // Closer
                    }
                }
            } 
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        // Distance is ~9.5 miles. Travel time is ~19 mins.
        // 09:30 + 19 mins = 09:49.
        // So 10:00 SHOULD be available.
        result.Any(s => s.StartTime == targetStart).Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldScanWholeDay_WhenTimeIsMidnight()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 0, 0, 0, TimeSpan.Zero); // Midnight
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner> { 
            new Practitioner { PractitionerId = practitionerId, IsActive = true, IsCareNavigator = true } 
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift> { 
            new ProviderShift { 
                PractitionerId = practitionerId, 
                DayOfWeek = DayOfWeek.Monday, 
                StartTime = new TimeSpan(8, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0) 
            } 
        }.BuildMockDbSet();
        var appointments = new List<Appointment>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        // Should have slots starting from 08:00 up to 16:00 (since duration is 1h and end is 17:00)
        result.Any(s => s.StartTime.Hour == 8).Should().BeTrue();
        result.Any(s => s.StartTime.Hour == 16).Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldScanPMOnly_WhenTimeIsAfternoon()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 14, 0, 0, TimeSpan.Zero); // 2:00 PM
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner> { 
            new Practitioner { PractitionerId = practitionerId, IsActive = true, IsCareNavigator = true } 
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift> { 
            new ProviderShift { 
                PractitionerId = practitionerId, 
                DayOfWeek = DayOfWeek.Monday, 
                StartTime = new TimeSpan(8, 0, 0), 
                EndTime = new TimeSpan(17, 0, 0) 
            } 
        }.BuildMockDbSet();
        var appointments = new List<Appointment>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        // Act
        var result = await _service.GetAvailableProvidersAsync(targetStart, duration, modality, patientId);

        // Assert
        // Should have slots starting from 13:00 (PM window start)
        // But since we asked for 14:00, the logic in SchedulingService.cs uses isAm ? 8 : 13.
        // targetStart.Hour is 14, so it's NOT < 13. PM scan uses 13:00 to 18:00.
        result.All(s => s.StartTime.Hour >= 13).Should().BeTrue();
        result.Any(s => s.StartTime.Hour == 8).Should().BeFalse();
    }
}
