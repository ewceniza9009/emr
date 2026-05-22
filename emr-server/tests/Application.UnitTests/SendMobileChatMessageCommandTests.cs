using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.Patients.Commands;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;
using Xunit;

namespace Application.UnitTests.Patients.Commands;

public class SendMobileChatMessageCommandTests
{
    private readonly Mock<IApplicationDbContext> _mockContext;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ISecurityAuditService> _mockAuditService;
    private readonly SendMobileChatMessageCommandHandler _handler;

    public SendMobileChatMessageCommandTests()
    {
        _mockContext = new Mock<IApplicationDbContext>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockAuditService = new Mock<ISecurityAuditService>();

        _handler = new SendMobileChatMessageCommandHandler(
            _mockContext.Object,
            _mockNotificationService.Object,
            _mockAuditService.Object
        );
    }

    [Fact]
    public async Task Handle_ShouldThrowArgumentException_WhenPatientDoesNotExist()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, "Hello");

        var patients = new List<Patient>().BuildMockDbSet();
        _mockContext.Setup(c => c.Patients).Returns(patients.Object);

        // Act
        var act = () => _handler.Handle(command, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Patient not found.");
    }

    [Fact]
    public async Task Handle_ShouldCreateCareThread_WhenCareThreadIdIsEmptyAndNoActiveThreadExists()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, "Hello");

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        CareThread? capturedThread = null;
        _mockContext.Setup(c => c.CareThreads.Add(It.IsAny<CareThread>()))
            .Callback<CareThread>(t => capturedThread = t);

        ChatMessage? capturedMessage = null;
        _mockContext.Setup(c => c.ChatMessages.Add(It.IsAny<ChatMessage>()))
            .Callback<ChatMessage>(m => capturedMessage = m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        capturedThread.Should().NotBeNull();
        capturedThread!.PatientId.Should().Be(patientId);
        capturedThread.TenantId.Should().Be(tenantId);
        capturedThread.Subject.Should().Be("Mobile Chat");
        capturedThread.IsActive.Should().BeTrue();

        capturedMessage.Should().NotBeNull();
        capturedMessage!.CareThreadId.Should().Be(capturedThread.CareThreadId);
        capturedMessage.TenantId.Should().Be(tenantId);
        capturedMessage.SenderRole.Should().Be("patient");
        capturedMessage.Content.Should().Be("Hello");
        capturedMessage.IsAttachment.Should().BeFalse();

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldUseActiveCareThread_WhenCareThreadIdIsEmptyAndActiveThreadExists()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var activeThreadId = Guid.NewGuid();
        var activeThread = new CareThread
        {
            CareThreadId = activeThreadId,
            PatientId = patientId,
            TenantId = tenantId,
            IsActive = true
        };

        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, "Hello again");

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread> { activeThread }.BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        ChatMessage? capturedMessage = null;
        _mockContext.Setup(c => c.ChatMessages.Add(It.IsAny<ChatMessage>()))
            .Callback<ChatMessage>(m => capturedMessage = m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _mockContext.Verify(c => c.CareThreads.Add(It.IsAny<CareThread>()), Times.Never);
        capturedMessage.Should().NotBeNull();
        capturedMessage!.CareThreadId.Should().Be(activeThreadId);
        capturedMessage.Content.Should().Be("Hello again");

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldUseProvidedCareThread_WhenCareThreadIdIsNotEmpty()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var providedThreadId = Guid.NewGuid();

        var command = new SendMobileChatMessageCommand(patientId, providedThreadId, "Specific thread message");

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        ChatMessage? capturedMessage = null;
        _mockContext.Setup(c => c.ChatMessages.Add(It.IsAny<ChatMessage>()))
            .Callback<ChatMessage>(m => capturedMessage = m);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        _mockContext.Verify(c => c.CareThreads.Add(It.IsAny<CareThread>()), Times.Never);
        capturedMessage.Should().NotBeNull();
        capturedMessage!.CareThreadId.Should().Be(providedThreadId);
        capturedMessage.Content.Should().Be("Specific thread message");

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("I have chest pain")]
    [InlineData("cannot breathe")]
    [InlineData("DIFFICULTY BREATHING")]
    [InlineData("severe dyspnea is occurring")]
    [InlineData("I am suffocating!")]
    [InlineData("choking")]
    [InlineData("suicidal thoughts")]
    [InlineData("heart attack")]
    public async Task Handle_ShouldAutoEscalateCaseAndSendNotificationAndLogAudit_WhenEmergencyKeywordDetected_AndCaseNavigatorIsAssigned(string messageContent)
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var navigatorId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var activeCase = new CareNavigationCase
        {
            PatientId = patientId,
            TenantId = tenantId,
            NavigatorId = navigatorId,
            AcuityLevel = AcuityLevel.Moderate,
            Status = CaseStatus.Open
        };

        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, messageContent);

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase> { activeCase }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        activeCase.AcuityLevel.Should().Be(AcuityLevel.Critical);

        _mockNotificationService.Verify(n => n.SendUserNotificationAsync(
            navigatorId.ToString(),
            "CRITICAL TRIAGE ALERT: John Doe",
            $"Emergency keyword detected in secure chat: \"{messageContent}\". Patient acuity auto-escalated to Critical.",
            NotificationPriority.Critical,
            "Clinical",
            $"/dashboard/patients/{patientId}"
        ), Times.Once);

        _mockNotificationService.Verify(n => n.SendGlobalNotificationAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<NotificationPriority>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);

        _mockAuditService.Verify(a => a.LogActionAsync(
            "PATIENT_ACUITY_AUTO_ESCALATED",
            $"Clinical auto-triage triggered by chat message: \"{messageContent}\"",
            patientId.ToString(),
            null,
            null
        ), Times.Once);

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldAutoEscalateCaseAndSendGlobalNotificationAndLogAudit_WhenEmergencyKeywordDetected_AndNoCaseExists()
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var messageContent = "chest pain and difficulty breathing";

        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, messageContent);

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase>().BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();

        _mockNotificationService.Verify(n => n.SendGlobalNotificationAsync(
            "CRITICAL TRIAGE ALERT: John Doe",
            $"Emergency keyword detected in secure chat: \"{messageContent}\". Patient has no active care navigator assigned.",
            NotificationPriority.Critical,
            "Clinical",
            $"/dashboard/patients/{patientId}"
        ), Times.Once);

        _mockNotificationService.Verify(n => n.SendUserNotificationAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<NotificationPriority>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);

        _mockAuditService.Verify(a => a.LogActionAsync(
            "PATIENT_ACUITY_AUTO_ESCALATED",
            $"Clinical auto-triage triggered by chat message: \"{messageContent}\"",
            patientId.ToString(),
            null,
            null
        ), Times.Once);

        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData("I have no chest pain")]
    [InlineData("patient denies chest pain")]
    [InlineData("difficulty breathing was ruled out")]
    [InlineData("shortness of breath resolved")]
    [InlineData("chest pain is negative")]
    [InlineData("without any signs of difficulty breathing")]
    public async Task Handle_ShouldNotAutoEscalate_WhenEmergencyKeywordIsNegated(string messageContent)
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var activeCase = new CareNavigationCase
        {
            PatientId = patientId,
            TenantId = tenantId,
            AcuityLevel = AcuityLevel.Moderate,
            Status = CaseStatus.Open
        };

        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, messageContent);

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase> { activeCase }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        activeCase.AcuityLevel.Should().Be(AcuityLevel.Moderate); // Should remain unchanged

        _mockNotificationService.Verify(n => n.SendUserNotificationAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<NotificationPriority>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);

        _mockNotificationService.Verify(n => n.SendGlobalNotificationAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<NotificationPriority>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);

        _mockAuditService.Verify(a => a.LogActionAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()
        ), Times.Never);
    }

    [Theory]
    [InlineData("chest pain but no shortness of breath")]
    [InlineData("patient has difficulty breathing, but chest pain was ruled out")]
    public async Task Handle_ShouldAutoEscalate_WhenMixedNegationOccurs(string messageContent)
    {
        // Arrange
        var patientId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var navigatorId = Guid.NewGuid();
        var patient = new Patient { PatientId = patientId, TenantId = tenantId, FirstName = "John", LastName = "Doe" };
        var activeCase = new CareNavigationCase
        {
            PatientId = patientId,
            TenantId = tenantId,
            NavigatorId = navigatorId,
            AcuityLevel = AcuityLevel.Moderate,
            Status = CaseStatus.Open
        };

        var command = new SendMobileChatMessageCommand(patientId, Guid.Empty, messageContent);

        var patients = new List<Patient> { patient }.BuildMockDbSet();
        var careThreads = new List<CareThread>().BuildMockDbSet();
        var chatMessages = new List<ChatMessage>().BuildMockDbSet();
        var careCases = new List<CareNavigationCase> { activeCase }.BuildMockDbSet();

        _mockContext.Setup(c => c.Patients).Returns(patients.Object);
        _mockContext.Setup(c => c.CareThreads).Returns(careThreads.Object);
        _mockContext.Setup(c => c.ChatMessages).Returns(chatMessages.Object);
        _mockContext.Setup(c => c.CareNavigationCases).Returns(careCases.Object);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        activeCase.AcuityLevel.Should().Be(AcuityLevel.Critical); // Should be escalated since one term is not negated

        _mockNotificationService.Verify(n => n.SendUserNotificationAsync(
            navigatorId.ToString(),
            "CRITICAL TRIAGE ALERT: John Doe",
            $"Emergency keyword detected in secure chat: \"{messageContent}\". Patient acuity auto-escalated to Critical.",
            NotificationPriority.Critical,
            "Clinical",
            $"/dashboard/patients/{patientId}"
        ), Times.Once);

        _mockAuditService.Verify(a => a.LogActionAsync(
            "PATIENT_ACUITY_AUTO_ESCALATED",
            $"Clinical auto-triage triggered by chat message: \"{messageContent}\"",
            patientId.ToString(),
            null,
            null
        ), Times.Once);
    }
}
