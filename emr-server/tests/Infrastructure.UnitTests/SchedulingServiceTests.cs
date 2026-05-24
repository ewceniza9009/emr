using Application.Common.Utils;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MockQueryable.Moq;
using Moq;

namespace Infrastructure.UnitTests;

public class SchedulingServiceTests
{
    private readonly Mock<IDbContextFactory<ApplicationDbContext>> _mockFactory;
    private readonly Mock<ApplicationDbContext> _mockContext;
    private readonly Mock<ILogger<SchedulingService>> _mockLogger;
    private readonly Mock<Application.Common.Interfaces.ICurrentUserService> _mockUserService;
    private readonly Mock<Application.Common.Interfaces.ISearchService> _mockSearchService;
    private readonly Mock<Application.Common.Interfaces.ITravelService> _mockTravelService;
    private readonly SchedulingService _service;

    // Realistic coordinates (e.g. within a city)
    private const double BaseLat = 10.0;
    private const double BaseLon = 10.0;
    private const double NearLat = 10.1;
    private const double NearLon = 10.1; // ~9.5 miles away, ~19 mins drive

    public SchedulingServiceTests()
    {
        _mockFactory = new Mock<IDbContextFactory<ApplicationDbContext>>();
        _mockUserService = new Mock<Application.Common.Interfaces.ICurrentUserService>();
        _mockSearchService = new Mock<Application.Common.Interfaces.ISearchService>();
        _mockTravelService = new Mock<Application.Common.Interfaces.ITravelService>();
        _mockTravelService
            .Setup(t => t.GetDistanceAndDurationAsync(
                It.IsAny<double>(),
                It.IsAny<double>(),
                It.IsAny<double>(),
                It.IsAny<double>(),
                It.IsAny<CancellationToken>()
            ))
            .ReturnsAsync((double lat1, double lon1, double lat2, double lon2, CancellationToken ct) =>
            {
                var dist = GeoUtils.CalculateDistance(lat1, lon1, lat2, lon2);
                var dur = GeoUtils.EstimateTravelTimeMinutes(dist);
                return (dist, dur);
            });

        _mockContext = new Mock<ApplicationDbContext>(
            new DbContextOptions<ApplicationDbContext>(),
            _mockUserService.Object,
            _mockSearchService.Object
        );
        _mockLogger = new Mock<ILogger<SchedulingService>>();

        _mockFactory
            .Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(_mockContext.Object);
        _mockFactory.Setup(f => f.CreateDbContext()).Returns(_mockContext.Object);

        _service = new SchedulingService(
            _mockFactory.Object,
            _mockTravelService.Object,
            _mockLogger.Object
        );

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
        _mockContext
            .Setup(c => c.TenantConfigurations)
            .Returns(
                new List<TenantConfiguration>
                {
                    new TenantConfiguration { Timezone = "Asia/Manila" },
                }
                    .BuildMockDbSet()
                    .Object
            );
        _mockContext
            .Setup(c => c.EntityAddresses)
            .Returns(new List<EntityAddress>().BuildMockDbSet().Object);
        _mockContext
            .Setup(c => c.PatientOutreaches)
            .Returns(new List<PatientOutreach>().BuildMockDbSet().Object);
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldSkipProvidersWithoutShifts()
    {
        var patientId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));
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
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));
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
                AppointmentId = Guid.NewGuid(),
                PractitionerId = practitionerId,
                PatientId = patientId,
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 10, 30, 0, TimeSpan.FromHours(8)),
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 11, 30, 0, TimeSpan.FromHours(8)),
                Status = AppointmentStatus.Scheduled,
                IsDeleted = false,
                SupportingClinicians = new List<Practitioner>(),
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
        var targetStart = new DateTimeOffset(2026, 5, 4, 9, 30, 0, TimeSpan.FromHours(8));
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
                ScheduledStart = new DateTimeOffset(2026, 5, 4, 8, 30, 0, TimeSpan.FromHours(8)),
                ScheduledEnd = new DateTimeOffset(2026, 5, 4, 9, 30, 0, TimeSpan.FromHours(8)),
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

        var entityAddresses = new List<EntityAddress>();
        foreach (var p in patients.Object)
        {
            foreach (var addr in p.Addresses)
            {
                addr.PatientId = p.PatientId;
                entityAddresses.Add(addr);
            }
        }
        foreach (var appt in appointments.Object)
        {
            if (appt.Patient != null)
            {
                foreach (var addr in appt.Patient.Addresses)
                {
                    addr.PatientId = appt.PatientId;
                    entityAddresses.Add(addr);
                }
            }
        }
        foreach (var pr in practitioners.Object)
        {
            foreach (var addr in pr.Addresses)
            {
                addr.PractitionerId = pr.PractitionerId;
                entityAddresses.Add(addr);
            }
        }
        _mockContext.Setup(c => c.EntityAddresses).Returns(entityAddresses.BuildMockDbSet().Object);

        var result = await _service.GetAvailableProvidersAsync(
            targetStart,
            duration,
            modality,
            patientId
        );
        // High-precision: Should be 10:00 AM (9:30 + 5 buffer + 19 drive = 9:54, next 15m slot is 10:00)
        result.Any(s => s.StartTime.Hour == 10 && s.StartTime.Minute == 0).Should().BeTrue();
        result.Any(s => s.StartTime.Hour == 9 && s.StartTime.Minute == 45).Should().BeFalse();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldRejectSlot_WhenReturnTripExceedsShiftEnd()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var shiftEnd = new TimeSpan(17, 0, 0);
        var targetStart = new DateTimeOffset(2026, 5, 4, 16, 30, 0, TimeSpan.FromHours(8));
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

        var entityAddresses = new List<EntityAddress>();
        foreach (var p in patients.Object)
        {
            foreach (var addr in p.Addresses)
            {
                addr.PatientId = p.PatientId;
                entityAddresses.Add(addr);
            }
        }
        foreach (var pr in practitioners.Object)
        {
            foreach (var addr in pr.Addresses)
            {
                addr.PractitionerId = pr.PractitionerId;
                entityAddresses.Add(addr);
            }
        }
        _mockContext.Setup(c => c.EntityAddresses).Returns(entityAddresses.BuildMockDbSet().Object);

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
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));
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

        var entityAddresses2 = new List<EntityAddress>();
        foreach (var p in patients.Object)
        {
            foreach (var addr in p.Addresses)
            {
                addr.PatientId = p.PatientId;
                entityAddresses2.Add(addr);
            }
        }
        foreach (var pr in practitioners.Object)
        {
            foreach (var addr in pr.Addresses)
            {
                addr.PractitionerId = pr.PractitionerId;
                entityAddresses2.Add(addr);
            }
        }
        _mockContext
            .Setup(c => c.EntityAddresses)
            .Returns(entityAddresses2.BuildMockDbSet().Object);

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
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));
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
                StartTime = new DateTimeOffset(2026, 5, 4, 10, 30, 0, TimeSpan.FromHours(8)),
                EndTime = new DateTimeOffset(2026, 5, 4, 11, 30, 0, TimeSpan.FromHours(8)),
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
        var targetStart = new DateTimeOffset(2026, 5, 4, 0, 0, 0, TimeSpan.FromHours(8));
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
        // High-precision: First slot should be around 8:24 AM (8:00 + 5 buffer + 19 drive)
        result.Any(s => s.StartTime.Hour == 8 && s.StartTime.Minute >= 20).Should().BeTrue();
    }

    [Fact]
    public async Task GetAvailableProvidersAsync_ShouldUseDefaultTravelTime_WhenAddressesAreMissing()
    {
        var patientId = Guid.NewGuid();
        var practitionerId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));
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
        // Now expects 2 minutes as it is an InPersonHomeVisit but addresses are missing
        result.First().TravelTimeInMinutes.Should().Be(2);
    }

    [Fact]
    public async Task RecalculateAppointmentStatsAsync_ShouldCalculateFromHome_ForFirstAppointment()
    {
        var practitionerId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var appointmentId = Guid.NewGuid();
        var targetStart = new DateTimeOffset(2026, 5, 4, 10, 0, 0, TimeSpan.FromHours(8));

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

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(
            appointments.Object.First()
        );

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
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(9), TimeSpan.FromHours(8)),
                ScheduledEnd = new DateTimeOffset(targetDate.AddHours(10), TimeSpan.FromHours(8)),
                Patient = patientList[0],
            },
            new Appointment
            {
                AppointmentId = appointmentId2,
                PatientId = patientId2,
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(11), TimeSpan.FromHours(8)),
                Modality = AppointmentModality.InPersonHomeVisit,
                Patient = patientList[1],
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(
            appointments.Object.First(a => a.AppointmentId == appointmentId2)
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

        var (distance, travelTime) = await _service.RecalculateAppointmentStatsAsync(
            appointments.Object.First()
        );

        distance.Should().Be(0);
        travelTime.Should().Be(0);
    }

    [Fact]
    public async Task ValidateLogisticsAsync_ShouldReject_WhenBufferIsViolated()
    {
        var practitionerId = Guid.NewGuid();
        var patientId1 = Guid.NewGuid();
        var patientId2 = Guid.NewGuid();
        var appointmentId2 = Guid.NewGuid();
        var targetDate = new DateTime(2026, 5, 4);

        var patientList = new List<Patient>
        {
            new Patient { PatientId = patientId1, Addresses = new List<EntityAddress>() },
            new Patient { PatientId = patientId2, Addresses = new List<EntityAddress>() },
        };
        var patients = patientList.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(9), TimeSpan.FromHours(8)),
                ScheduledEnd = new DateTimeOffset(targetDate.AddHours(10), TimeSpan.FromHours(8)),
                Patient = patientList[0],
                Modality = AppointmentModality.InPersonHomeVisit,
            },
            new Appointment
            {
                AppointmentId = appointmentId2,
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(
                    targetDate.AddHours(10).AddMinutes(5),
                    TimeSpan.FromHours(8)
                ), // Only 5 mins after
                ScheduledEnd = new DateTimeOffset(targetDate.AddHours(11), TimeSpan.FromHours(8)),
                Patient = patientList[1],
                Modality = AppointmentModality.InPersonHomeVisit,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);

        var (isValid, reason) = await _service.ValidateLogisticsAsync(
            appointments.Object.First(a => a.AppointmentId == appointmentId2)
        );

        isValid.Should().BeFalse();
        reason.Should().Contain("Logistics Violation");
    }

    [Fact]
    public async Task ValidateLogisticsAsync_ShouldNotCrash_WhenCoordinatesAreNull()
    {
        var practitionerId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var targetDate = new DateTime(2026, 5, 4);

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
                        Address = new Address
                        {
                            Latitude = null, // Null coordinates!
                            Longitude = null,
                        },
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
                        Address = new Address
                        {
                            Latitude = null, // Null coordinates!
                            Longitude = null,
                        },
                    },
                },
            },
        }.BuildMockDbSet();

        var appointments = new List<Appointment>
        {
            new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PractitionerId = practitionerId,
                ScheduledStart = new DateTimeOffset(targetDate.AddHours(9), TimeSpan.FromHours(8)),
                ScheduledEnd = new DateTimeOffset(targetDate.AddHours(10), TimeSpan.FromHours(8)),
                PatientId = patientId,
                Modality = AppointmentModality.InPersonHomeVisit,
            },
        }.BuildMockDbSet();

        var shifts = new List<ProviderShift>
        {
            new ProviderShift
            {
                PractitionerId = practitionerId,
                DayOfWeek = DayOfWeek.Monday,
                StartTime = TimeSpan.FromHours(8),
                EndTime = TimeSpan.FromHours(17),
                IsActive = true,
            },
        }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.Practitioners).Returns(practitioners.Object);
        _mockContext.Setup(c => c.Appointments).Returns(appointments.Object);
        _mockContext.Setup(c => c.ProviderShifts).Returns(shifts.Object);

        var act = () => _service.ValidateLogisticsAsync(appointments.Object.First());
        await act.Should().NotThrowAsync();
    }
}
