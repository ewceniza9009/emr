using Application.Common.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Infrastructure.Services;

public class QuestPdfService : IPdfService
{
    private readonly IApplicationDbContext _context;

    public QuestPdfService(IApplicationDbContext context)
    {
        _context = context;
        // QuestPDF License setup (Required for Community License)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<byte[]> GenerateEncounterSummaryAsync(Guid appointmentId)
    {
        var appointment = await _context
            .Appointments.Include(a => a.Patient)
            .Include(a => a.Practitioner)
            .Include(a => a.SupportingClinicians)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

        if (appointment == null)
            throw new Exception("Appointment not found");

        // Try to find an associated encounter to get notes
        var encounter = await _context
            .ClinicalEncounters.Include(e => e.ClinicalNotes)
            .Include(e => e.VitalSigns)
            .Include(e => e.Diagnoses)
            .FirstOrDefaultAsync(e => e.AppointmentId == appointmentId);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header()
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text("Aura Clinical OS")
                                    .FontSize(20)
                                    .SemiBold()
                                    .FontColor(Colors.Teal.Medium);
                                col.Item().Text("Clinical Encounter Summary").FontSize(14).Medium();
                            });

                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text($"Date: {appointment.ScheduledStart:MMM dd, yyyy}")
                                    .AlignRight();
                                col.Item()
                                    .Text(
                                        $"Time: {appointment.ScheduledStart:hh:mm tt} - {appointment.ScheduledEnd:hh:mm tt}"
                                    )
                                    .AlignRight();
                                col.Item().Text($"Status: {appointment.Status}").AlignRight();
                            });
                    });

                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Column(col =>
                    {
                        // Patient Section
                        col.Item()
                            .Background(Colors.Grey.Lighten4)
                            .Padding(10)
                            .Row(row =>
                            {
                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("PATIENT INFORMATION")
                                            .FontSize(8)
                                            .SemiBold()
                                            .FontColor(Colors.Grey.Medium);
                                        c.Item()
                                            .Text(
                                                $"{appointment.Patient.FirstName} {appointment.Patient.LastName}"
                                            )
                                            .FontSize(12)
                                            .SemiBold();
                                        c.Item().Text($"MRN: {appointment.Patient.Mrn}");
                                    });

                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("PRIMARY PRACTITIONER")
                                            .FontSize(8)
                                            .SemiBold()
                                            .FontColor(Colors.Grey.Medium);
                                        c.Item()
                                            .Text(
                                                $"{appointment.Practitioner?.FirstName} {appointment.Practitioner?.LastName}"
                                            )
                                            .FontSize(12);
                                        c.Item()
                                            .Text($"{appointment.Practitioner?.Position}")
                                            .FontSize(9)
                                            .Italic();
                                    });
                            });

                        col.Item()
                            .PaddingTop(20)
                            .Text("ENCOUNTER DETAILS")
                            .FontSize(10)
                            .SemiBold()
                            .Underline();

                        if (encounter != null)
                        {
                            col.Item()
                                .PaddingTop(10)
                                .Text(text =>
                                {
                                    text.Span("Chief Complaint: ").SemiBold();
                                    text.Span(encounter.ChiefComplaint);
                                });

                            if (encounter.VitalSigns.Any())
                            {
                                col.Item().PaddingTop(15).Text("Vital Signs").SemiBold();
                                col.Item()
                                    .PaddingTop(5)
                                    .Table(table =>
                                    {
                                        table.ColumnsDefinition(columns =>
                                        {
                                            columns.RelativeColumn();
                                            columns.RelativeColumn();
                                            columns.RelativeColumn();
                                        });
                                        table.Header(header =>
                                        {
                                            header
                                                .Cell()
                                                .BorderBottom(1)
                                                .Padding(2)
                                                .Text("Metric")
                                                .SemiBold();
                                            header
                                                .Cell()
                                                .BorderBottom(1)
                                                .Padding(2)
                                                .Text("Value")
                                                .SemiBold();
                                            header
                                                .Cell()
                                                .BorderBottom(1)
                                                .Padding(2)
                                                .Text("Recorded At")
                                                .SemiBold();
                                        });
                                        foreach (var vital in encounter.VitalSigns)
                                        {
                                            if (vital.HeartRate.HasValue)
                                                AddVitalRow(
                                                    table,
                                                    "Heart Rate",
                                                    $"{vital.HeartRate} bpm",
                                                    vital.RecordedAt
                                                );
                                            if (vital.Temperature.HasValue)
                                                AddVitalRow(
                                                    table,
                                                    "Temp",
                                                    $"{vital.Temperature} °F",
                                                    vital.RecordedAt
                                                );
                                            if (vital.BloodPressureSystolic.HasValue)
                                                AddVitalRow(
                                                    table,
                                                    "BP",
                                                    $"{vital.BloodPressureSystolic}/{vital.BloodPressureDiastolic}",
                                                    vital.RecordedAt
                                                );
                                            if (vital.OxygenSaturation.HasValue)
                                                AddVitalRow(
                                                    table,
                                                    "O2 Sat",
                                                    $"{vital.OxygenSaturation}%",
                                                    vital.RecordedAt
                                                );
                                        }
                                    });
                            }

                            if (encounter.ClinicalNotes.Any())
                            {
                                col.Item().PaddingTop(15).Text("Clinical Narrative").SemiBold();
                                foreach (var note in encounter.ClinicalNotes)
                                {
                                    col.Item().PaddingTop(5).Text(note.Content).LineHeight(1.4f);
                                }
                            }

                            if (encounter.Diagnoses.Any())
                            {
                                col.Item().PaddingTop(15).Text("Assessed Diagnoses").SemiBold();
                                foreach (var diag in encounter.Diagnoses)
                                {
                                    col.Item()
                                        .PaddingTop(2)
                                        .Text($"• {diag.Description} ({diag.Icd10Code})");
                                }
                            }
                        }
                        else
                        {
                            col.Item()
                                .PaddingTop(30)
                                .AlignCenter()
                                .Text(
                                    "No clinical encounter documentation has been finalized for this appointment."
                                )
                                .Italic()
                                .FontColor(Colors.Grey.Medium);
                        }
                    });

                page.Footer()
                    .PaddingTop(20)
                    .Column(footer =>
                    {
                        footer.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                        footer
                            .Item()
                            .PaddingTop(5)
                            .Row(row =>
                            {
                                row.RelativeItem()
                                    .Text("Aura EMR - Mission Critical Clinical OS")
                                    .FontSize(8)
                                    .FontColor(Colors.Grey.Medium);
                                row.RelativeItem()
                                    .AlignRight()
                                    .Text(x =>
                                    {
                                        x.Span("Page ");
                                        x.CurrentPageNumber();
                                        x.Span(" of ");
                                        x.TotalPages();
                                    });
                            });
                    });
            });
        });

        return document.GeneratePdf();
    }

    private void AddVitalRow(QuestPDF.Fluent.TableDescriptor table, string metric, string value, DateTimeOffset recordedAt)
    {
        table.Cell().Padding(2).Text(metric);
        table.Cell().Padding(2).Text(value);
        table.Cell().Padding(2).Text(recordedAt.ToString("MMM dd, HH:mm"));
    }
}
