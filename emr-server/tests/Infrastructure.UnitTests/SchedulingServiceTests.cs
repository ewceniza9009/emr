using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure.Services;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;

namespace Infrastructure.UnitTests;

public class SchedulingServiceTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<ILogger<SchedulingService>> _mockLogger;
    private readonly SchedulingService _service;

    // Realistic coordinates (e.g. within a city)
    private const double BaseLat = 10.0;
    private const double BaseLon = 10.0;
    private const double NearLat = 10.1;
    private const double NearLon = 10.1; // ~9.5 miles away, ~19 mins drive

    public SchedulingServiceTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockLogger = new Mock<ILogger<SchedulingService>>();
        _service = new SchedulingService(_mockContext.Object, _mockLogger.Object);

        // Default empty setups to avoid NullReferenceExceptions
        _mockContext.Setup(c => c.Patients).Returns(new List<Patient>().BuildMockDbSet().Object);
        _mockContext
            .Setup(c => c.Practitioners)
            .Returns(new List<Practitioner>().BuildMockDbSet().Object);
        _mockContext
            .Setup(c => c.ProviderShifts)
            .Returns(new List<ProviderShift>().BuildMockDbSet().Object);
        _mockContext
            .Setup(c => c.Appointments)
            .Returns(new List<Appointment>().BuildMockDbSet().Object);
        _mockContext
            .Setup(c => c.ScheduleBlocks)
            .Returns(new List<ScheduleBlock>().BuildMockDbSet().Object);
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipProvidersWithoutShifts()
    {
        var patientId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = Guid.NewGuid(),
                LastName = "NoShift",
                IsActive = true,
                IsCareNavigator = true,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipSlot_WhenThereIsAConflict()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                LastName = "Busy",
                IsActive = true,
                IsCareNavigator = true,
            },
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 10, 30, 0, TimeSpan.Zero),
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 11, 30, 0, TimeSpan.Zero),
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Any(s => s.StartTime == targetStart).Should().BeFalse();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldAccountForTravelTimeFromPreviousAppointment()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient>
        {
            new Patient
            {
                PatientId = patientId,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = BaseLat, Longitude = BaseLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = NearLat, Longitude = NearLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 8, 30, 0, TimeSpan.Zero),
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 9, 30, 0, TimeSpan.Zero),
                Patient = new Patient
                {
                    Addresses = new List<EntityAddress>
                    {
                        new EntityAddress
                        {
                            IsPrimary = true,
                            Address = new Address { Latitude = NearLat, Longitude = NearLon },
                        },
                    },
                },
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Any(s => s.StartTime == targetStart).Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldRejectSlot_WhenReturnTripExceedsShiftEnd()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var shiftEnd = new TimeSpan(17, 0, 0);
        var targetStart = new DateTimeOffset(2026, 5, 4, 16, 30, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromMinutes(30);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient>
        {
            new Patient
            {
                PatientId = patientId,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = BaseLat, Longitude = BaseLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address
                        {
                            Latitude = BaseLat + 0.5,
                            Longitude = BaseLon + 0.5,
                        },
                    },
                },
            },
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = shiftEnd,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Any(s => s.StartTime == targetStart).Should().BeFalse();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldRejectSlot_WhenDistanceIsNonsense()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient>
        {
            new Patient
            {
                PatientId = patientId,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = BaseLat, Longitude = BaseLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address
                        {
                            Latitude = BaseLat + 5.0,
                            Longitude = BaseLon + 5.0,
                        },
                    },
                },
            },
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipSlot_WhenThereIsAnOOFBlock()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
            },
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();
        var blocks = new List<ScheduleBlock>
        {
            new ScheduleBlock
            {
                PractitionerId = practitionerId,
                StartTime = new DateTimeOffset(2026, 5, 4, 10, 30, 0, TimeSpan.Zero),
                EndTime = new DateTimeOffset(2026, 5, 4, 11, 30, 0, TimeSpan.Zero),
                Status = ScheduleBlockStatus.Blocked,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);
        _mockContext.Setup(c => c.ScheduleBlocks).Returns(blocks.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Any(s => s.StartTime == targetStart).Should().BeFalse();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldScanWholeDay_WhenTimeIsMidnight()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 0, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient> { new Patient { PatientId = patientId } }.BuildMockDbSet();
        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
            },
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Any(s => s.StartTime.Hour == 9).Should().BeTrue(); // Accounts for travel from home at 8:00
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldUseDefaultTravelTime_WhenAddressesAreMissing()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);
        var duration = TimeSpan.FromHours(1);
        var modality = AppointmentModality.InPersonHomeVisit;

        var patients = new List<Patient>
        {
            new Patient { PatientId = patientId, Addresses = new List<EntityAddress>() },
        }.BuildMockDbSet();
        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                IsActive = true,
                IsCareNavigator = true,
                Addresses = new List<EntityAddress>(),
            },
        }.BuildMockDbSet();
        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = new TimeSpan(8, 0, 0),
                EndTime = new TimeSpan(17, 0, 0),
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        result.Should().NotBeEmpty();
        result.First().TravelTimeInMinutes.Should().Be(15);
    }

    [Fact]
    public async Task RecalculateAppointmentStatsAsync_ShouldCalculateFromHome_ForFirstAppointment()
    {
        var practitionerId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var appointmentId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.Zero);

        var patients = new List<Patient>
        {
            new Patient
            {
                PatientId = patientId,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = BaseLat, Longitude = BaseLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var practitioners = new List<Practitioner>
        {
            new Practitioner
            {
                PractitionerId = practitionerId,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = NearLat, Longitude = NearLon },
                    },
                },
            },
        }.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                AppointmentId = appointmentId,
                PatientId = patientId,
                PractitionerId = practitionerId,
                ScheduledStart = targetStart,
                Modality = AppointmentModality.InPersonHomeVisit,
                Patient = patients.Object.First(),
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(appointmentId);

        distance.Should().BeGreaterThan(0);
        travelTime.Should().BeGreaterThan(0);
        distance.Should().BeApproximately(9.74, 0.1);
    }

    [Fact]
    public async Task RecalculateAppointmentStatsAsync_ShouldCalculateFromPreviousAppointment()
    {
        var practitionerId = Guid.NewGuid();
        var patientId1 = Guid.NewGuid();
        var patientId2 = Guid.NewGuid();
        var appointmentId2 = Guid.NewGuid();
        var targetDate = new DateTime(2026, 5, 4);

        var patientList = new List<Patient>
        {
            new Patient
            {
                PatientId = patientId1,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = NearLat, Longitude = NearLon },
                    },
                },
            },
            new Patient
            {
                PatientId = patientId2,
                Addresses = new List<EntityAddress>
                {
                    new EntityAddress
                    {
                        IsPrimary = true,
                        Address = new Address { Latitude = BaseLat, Longitude = BaseLon },
                    },
                },
            },
        };
        var patients = patientList.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PatientId = patientId1,
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(9), TimeSpan.Zero),
                ScheduledEnd = new DateTimeOffset(targetDate.AddHours(10), TimeSpan.Zero),
                Patient = patientList[0],
            },
            new Appointment
            {
                AppointmentId = appointmentId2,
                PatientId = patientId2,
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(11), TimeSpan.Zero),
                Modality = AppointmentModality.InPersonHomeVisit,
                Patient = patientList[1],
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(
            appointmentId2
        );

        distance.Should().BeApproximately(9.74, 0.1);
        travelTime.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RecalculateAppointmentStatsAsync_ShouldReturnZero_ForTelehealth()
    {
        var appointmentId = Guid.NewGuid();
        var appointments = new List<Appointment>
        {
            new Appointment
            {
                AppointmentId = appointmentId,
                Modality = AppointmentModality.TelehealthVideo,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(appointmentId);

        distance.Should().Be(0);
        travelTime.Should().Be(0);
    }
}
