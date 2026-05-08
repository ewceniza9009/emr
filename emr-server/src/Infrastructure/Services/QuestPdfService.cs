using Application.Common.Interfaces;
using Domain.Entities;
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

    public async Task<byte[]> GeneratePatientDossierAsync(Guid patientId)
    {
        var patient = await _context
            .Patients.IgnoreQueryFilters()
            .Include(p => p.Addresses)
                .ThenInclude(a => a.Address)
            .Include(p => p.Phones)
            .Include(p => p.Emails)
            .Include(p => p.Contacts)
            .Include(p => p.Encounters)
                .ThenInclude(e => e.VitalSigns)
            .Include(p => p.Encounters)
                .ThenInclude(e => e.ClinicalNotes)
            .Include(p => p.Encounters)
                .ThenInclude(e => e.Practitioner)
            .FirstOrDefaultAsync(p => p.PatientId == patientId);

        if (patient == null)
            throw new Exception("Patient not found");

        var allergies = await _context
            .Allergies.Where(a => a.PatientId == patientId)
            .OrderBy(a => a.IdentifiedAt)
            .ToListAsync();
        var problems = await _context
            .Diagnoses.Where(d => d.PatientId == patientId)
            .OrderBy(d => d.DiagnosedAt)
            .ToListAsync();
        var prescriptions = await _context
            .Prescriptions.Include(p => p.Medication)
            .Where(p => p.PatientId == patientId)
            .OrderBy(p => p.StartDate)
            .ToListAsync();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                // Header - Branding & Patient Badge
                page.Header()
                    .PaddingBottom(20)
                    .BorderBottom(3)
                    .BorderColor(Colors.Teal.Medium)
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text("HALCYON CLINICAL OS")
                                    .FontSize(22)
                                    .ExtraBold()
                                    .FontColor(Colors.Teal.Medium);
                                col.Item()
                                    .Text("AUTHENTICATED PATIENT DOSSIER & REGISTRY")
                                    .FontSize(8)
                                    .Medium()
                                    .FontColor(Colors.Grey.Medium)
                                    .LetterSpacing(0.2f);
                            });

                        row.RelativeItem()
                            .AlignRight()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text($"{patient.FirstName} {patient.LastName}")
                                    .FontSize(14)
                                    .Bold();
                                col.Item()
                                    .Text($"MRN: {patient.Mrn} | DOB: {patient.Dob:MMM dd, yyyy}")
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Darken1);
                                col.Item()
                                    .Text($"GENDER: {patient.BiologicalSex.ToUpper()}")
                                    .FontSize(8)
                                    .FontColor(Colors.Grey.Medium);
                            });
                    });

                page.Content()
                    .PaddingVertical(20)
                    .Column(col =>
                    {
                        // Section: Clinical Snapshot (Allergies & Problems)
                        col.Item()
                            .Row(row =>
                            {
                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .PaddingBottom(5)
                                            .Text("ALLERGIES")
                                            .FontSize(8)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        if (allergies.Any())
                                        {
                                            foreach (var allergy in allergies)
                                                c.Item()
                                                    .Text(
                                                        $"• {allergy.Allergen} ({allergy.Reaction})"
                                                    )
                                                    .FontSize(9);
                                        }
                                        else
                                            c.Item()
                                                .Text("No known allergies reported")
                                                .FontSize(9)
                                                .Italic();
                                    });

                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .PaddingBottom(5)
                                            .Text("PROBLEM LIST")
                                            .FontSize(8)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        if (problems.Any())
                                        {
                                            foreach (var problem in problems)
                                                c.Item()
                                                    .Text(
                                                        $"• {problem.Description} [{problem.Icd10Code}]"
                                                    )
                                                    .FontSize(9);
                                        }
                                        else
                                            c.Item()
                                                .Text("No active clinical problems recorded")
                                                .FontSize(9)
                                                .Italic();
                                    });
                            });

                        // Section: Medications
                        col.Item()
                            .PaddingTop(20)
                            .Column(c =>
                            {
                                c.Item()
                                    .PaddingBottom(5)
                                    .BorderBottom(1)
                                    .BorderColor(Colors.Grey.Lighten2)
                                    .Text("ACTIVE MEDICATIONS")
                                    .FontSize(8)
                                    .Bold()
                                    .FontColor(Colors.Teal.Medium);
                                if (prescriptions.Any())
                                {
                                    c.Item()
                                        .Table(table =>
                                        {
                                            table.ColumnsDefinition(columns =>
                                            {
                                                columns.RelativeColumn(3);
                                                columns.RelativeColumn(2);
                                                columns.RelativeColumn(2);
                                            });
                                            foreach (var p in prescriptions)
                                            {
                                                table
                                                    .Cell()
                                                    .PaddingVertical(2)
                                                    .Text(p.Medication.Name)
                                                    .FontSize(9)
                                                    .SemiBold();
                                                table
                                                    .Cell()
                                                    .PaddingVertical(2)
                                                    .Text(p.Dose)
                                                    .FontSize(9);
                                                table
                                                    .Cell()
                                                    .PaddingVertical(2)
                                                    .Text(p.Frequency)
                                                    .FontSize(9);
                                            }
                                        });
                                }
                                else
                                    c.Item()
                                        .PaddingTop(5)
                                        .Text("No medications currently registered")
                                        .FontSize(9)
                                        .Italic();
                            });

                        // Section: Encounter History Timeline
                        col.Item()
                            .PaddingTop(30)
                            .Column(c =>
                            {
                                c.Item()
                                    .PaddingBottom(10)
                                    .Text("ENCOUNTER TIMELINE & CLINICAL NOTES")
                                    .FontSize(11)
                                    .Bold()
                                    .FontColor(Colors.Teal.Medium);

                                var encounters = patient
                                    .Encounters.OrderBy(e => e.EncounterDate)
                                    .ToList();
                                foreach (var encounter in encounters)
                                {
                                    c.Item()
                                        .PaddingBottom(15)
                                        .Border(1)
                                        .BorderColor(Colors.Grey.Lighten3)
                                        .Padding(10)
                                        .Column(ecol =>
                                        {
                                            ecol.Item()
                                                .Row(erow =>
                                                {
                                                    erow.RelativeItem()
                                                        .Text(
                                                            encounter
                                                                .Type.ToString()
                                                                .Replace("_", " ")
                                                        )
                                                        .FontSize(10)
                                                        .Bold();
                                                    erow.RelativeItem()
                                                        .AlignRight()
                                                        .Text(
                                                            encounter.EncounterDate.ToString(
                                                                "MMM dd, yyyy HH:mm"
                                                            )
                                                        )
                                                        .FontSize(8)
                                                        .FontColor(Colors.Grey.Medium);
                                                });
                                            ecol.Item()
                                                .Text(
                                                    $"Practitioner: {encounter.Practitioner?.FirstName} {encounter.Practitioner?.LastName}"
                                                )
                                                .FontSize(8)
                                                .Italic();

                                            if (encounter.ClinicalNotes?.Any() == true)
                                            {
                                                ecol.Item()
                                                    .PaddingTop(5)
                                                    .Text(t =>
                                                        t.Span(
                                                                encounter
                                                                    .ClinicalNotes.First()
                                                                    .Content
                                                            )
                                                            .FontSize(9)
                                                    );
                                            }

                                            if (encounter.VitalSigns?.Any() == true)
                                            {
                                                var v = encounter.VitalSigns.First();
                                                ecol.Item()
                                                    .PaddingTop(5)
                                                    .Text(t =>
                                                        t.Span(
                                                                $"Vitals: BP {v.BloodPressureSystolic}/{v.BloodPressureDiastolic} | HR {v.HeartRate} | SpO2 {v.OxygenSaturation}% | T {v.Temperature}°F"
                                                            )
                                                            .FontSize(8)
                                                            .FontColor(Colors.Teal.Medium)
                                                    );
                                            }
                                        });
                                }
                            });
                    });

                page.Footer()
                    .PaddingTop(20)
                    .AlignCenter()
                    .DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium))
                    .Text(x =>
                    {
                        x.Span("CONFIDENTIAL CLINICAL RECORD - GENERATED ON ");
                        x.Span(DateTime.Now.ToString("MMM dd, yyyy HH:mm")).Bold();
                        x.Span(" | PAGE ");
                        x.CurrentPageNumber();
                    });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateInvoiceAsync(Guid invoiceId)
    {
        var invoice = await _context
            .BillingInvoices.IgnoreQueryFilters()
            .Include(i => i.Items)
            .Include(i => i.Patient)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new Exception("Invoice not found");

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                page.Header()
                    .PaddingBottom(10)
                    .BorderBottom(1.5f)
                    .BorderColor(Colors.Teal.Medium)
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text("HALCYON CLINICAL OS")
                                    .FontSize(22)
                                    .ExtraBold()
                                    .FontColor(Colors.Teal.Medium);
                                col.Item()
                                    .Text("OFFICIAL BILLING STATEMENT")
                                    .FontSize(9)
                                    .Medium()
                                    .FontColor(Colors.Grey.Medium)
                                    .LetterSpacing(0.1f);
                            });

                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .AlignRight()
                                    .Text("INVOICE")
                                    .FontSize(14)
                                    .Bold()
                                    .FontColor(Colors.Teal.Medium);
                                col.Item()
                                    .AlignRight()
                                    .Text($"INVOICE #: {invoice.InvoiceNumber}")
                                    .FontSize(9)
                                    .Bold();
                                col.Item()
                                    .AlignRight()
                                    .Text($"DATE: {invoice.GeneratedAt:MMM dd, yyyy}")
                                    .FontSize(8)
                                    .FontColor(Colors.Grey.Medium);
                            });
                    });

                page.Content()
                    .PaddingVertical(20)
                    .Column(col =>
                    {
                        col.Item()
                            .Row(row =>
                            {
                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("BILL TO")
                                            .FontSize(8)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        c.Item()
                                            .PaddingTop(2)
                                            .Text(
                                                $"{invoice.Patient.FirstName} {invoice.Patient.LastName}"
                                            )
                                            .FontSize(14)
                                            .SemiBold();
                                        c.Item()
                                            .Text($"MRN: {invoice.Patient.Mrn}")
                                            .FontSize(9)
                                            .FontColor(Colors.Grey.Medium);
                                    });

                                row.RelativeItem()
                                    .AlignRight()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("PAYMENT TERMS")
                                            .FontSize(8)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        c.Item()
                                            .PaddingTop(2)
                                            .Text($"DUE DATE: {invoice.DueDate:MMM dd, yyyy}")
                                            .FontSize(10)
                                            .Bold();
                                        c.Item()
                                            .Text($"STATUS: {invoice.Status.ToString().ToUpper()}")
                                            .FontSize(9)
                                            .FontColor(
                                                invoice.Status == InvoiceStatus.Paid
                                                    ? Colors.Green.Medium
                                                    : Colors.Orange.Medium
                                            );
                                    });
                            });

                        col.Item().PaddingTop(30);
                        AddBillingTable(col, invoice);
                    });

                page.Footer()
                    .PaddingTop(20)
                    .Column(footer =>
                    {
                        footer.Item().LineHorizontal(1).LineColor(Colors.Teal.Medium);
                        footer
                            .Item()
                            .PaddingTop(5)
                            .AlignCenter()
                            .DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium))
                            .Text(
                                "Please make all checks payable to Halcyon Clinical Services. For billing inquiries, call (555) 012-3456."
                            );
                        footer
                            .Item()
                            .AlignCenter()
                            .DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Medium))
                            .Text(x =>
                            {
                                x.Span("PAGE ");
                                x.CurrentPageNumber();
                                x.Span(" OF ");
                                x.TotalPages();
                            });
                    });
            });
        });

        return document.GeneratePdf();
    }

    private void AddBillingTable(ColumnDescriptor col, Domain.Entities.BillingInvoice invoice)
    {
        col.Item()
            .Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(4);
                    columns.RelativeColumn();
                    columns.RelativeColumn(1.5f);
                    columns.RelativeColumn(1.5f);
                });

                table.Header(header =>
                {
                    header
                        .Cell()
                        .Background(Colors.Teal.Lighten5)
                        .Padding(5)
                        .Text("DESCRIPTION")
                        .FontSize(8)
                        .Bold();
                    header
                        .Cell()
                        .Background(Colors.Teal.Lighten5)
                        .Padding(5)
                        .Text("QTY")
                        .FontSize(8)
                        .Bold()
                        .AlignRight();
                    header
                        .Cell()
                        .Background(Colors.Teal.Lighten5)
                        .Padding(5)
                        .Text("UNIT PRICE")
                        .FontSize(8)
                        .Bold()
                        .AlignRight();
                    header
                        .Cell()
                        .Background(Colors.Teal.Lighten5)
                        .Padding(5)
                        .Text("TOTAL")
                        .FontSize(8)
                        .Bold()
                        .AlignRight();
                });

                foreach (var item in invoice.Items)
                {
                    table
                        .Cell()
                        .BorderBottom(0.5f)
                        .BorderColor(Colors.Grey.Lighten3)
                        .Padding(5)
                        .Text(item.Description)
                        .FontSize(9);
                    table
                        .Cell()
                        .BorderBottom(0.5f)
                        .BorderColor(Colors.Grey.Lighten3)
                        .Padding(5)
                        .Text(item.Quantity.ToString("N0"))
                        .FontSize(9)
                        .AlignRight();
                    table
                        .Cell()
                        .BorderBottom(0.5f)
                        .BorderColor(Colors.Grey.Lighten3)
                        .Padding(5)
                        .Text(item.UnitPrice.ToString("C"))
                        .FontSize(9)
                        .AlignRight();
                    table
                        .Cell()
                        .BorderBottom(0.5f)
                        .BorderColor(Colors.Grey.Lighten3)
                        .Padding(5)
                        .Text(item.TotalPrice.ToString("C"))
                        .FontSize(9)
                        .SemiBold()
                        .AlignRight();
                }

                table.Footer(footer =>
                {
                    footer
                        .Cell()
                        .ColumnSpan(3)
                        .PaddingTop(10)
                        .AlignRight()
                        .Text("SUBTOTAL:")
                        .FontSize(9)
                        .Bold();
                    footer
                        .Cell()
                        .PaddingTop(10)
                        .AlignRight()
                        .Text(invoice.SubtotalAmount.ToString("C"))
                        .FontSize(9)
                        .Bold();

                    footer
                        .Cell()
                        .ColumnSpan(3)
                        .PaddingTop(2)
                        .AlignRight()
                        .Text("COVERED AMOUNT:")
                        .FontSize(9)
                        .FontColor(Colors.Green.Medium);
                    footer
                        .Cell()
                        .PaddingTop(2)
                        .AlignRight()
                        .Text($"-{invoice.CoveredAmount:C}")
                        .FontSize(9)
                        .FontColor(Colors.Green.Medium);
                });
            });

        col.Item()
            .PaddingTop(10)
            .AlignRight()
            .Background(Colors.Grey.Lighten4)
            .Padding(10)
            .Row(row =>
            {
                row.RelativeItem()
                    .AlignRight()
                    .Column(c =>
                    {
                        c.Item()
                            .Text("TOTAL AMOUNT DUE")
                            .FontSize(10)
                            .Bold()
                            .FontColor(Colors.Teal.Medium);
                        c.Item()
                            .Text(invoice.PatientResponsibility.ToString("C"))
                            .FontSize(18)
                            .ExtraBold()
                            .FontColor(Colors.Red.Medium);
                    });
            });
    }

    public async Task<byte[]> GenerateEncounterSummaryAsync(Guid appointmentId)
    {
        var appointment = await _context
            .Appointments.IgnoreQueryFilters()
            .Include(a => a.Patient)
            .Include(a => a.Encounters)
                .ThenInclude(e => e.VitalSigns)
            .Include(a => a.Encounters)
                .ThenInclude(e => e.ClinicalNotes)
            .Include(a => a.Encounters)
                .ThenInclude(e => e.Practitioner)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);

        if (appointment == null)
            throw new Exception($"Appointment record not found for ID: {appointmentId}");

        var patient = appointment.Patient;
        var encounter = appointment
            .Encounters.OrderByDescending(e => e.EncounterDate)
            .FirstOrDefault();

        var allAssessments = await _context.AssessmentResponses
            .IgnoreQueryFilters()
            .Include(a => a.Questionnaire)
            .Include(a => a.Assessor)
            .Where(a => a.Encounter != null && a.Encounter.AppointmentId == appointmentId)
            .OrderByDescending(a => a.CompletedAt)
            .ToListAsync();

        var assessments = allAssessments
            .GroupBy(a => a.QuestionnaireId)
            .Select(g => g.First())
            .ToList();

        var esas = await _context.EsasAssessments
            .IgnoreQueryFilters()
            .Where(e => e.Encounter != null && e.Encounter.AppointmentId == appointmentId)
            .FirstOrDefaultAsync();

        var invoice =
            encounter != null
                ? await _context
                    .BillingInvoices.IgnoreQueryFilters()
                    .Include(i => i.Items)
                    .FirstOrDefaultAsync(i => i.EncounterId == encounter.EncounterId)
                : null;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Helvetica"));

                // Header - Branding & Identity Badge
                page.Header()
                    .PaddingBottom(10)
                    .BorderBottom(1)
                    .BorderColor(Colors.Teal.Medium)
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text("HALCYON CLINICAL OS")
                                    .FontSize(20)
                                    .ExtraBold()
                                    .FontColor(Colors.Teal.Medium);
                                col.Item()
                                    .Text("OFFICIAL VISIT SUMMARY & CLINICAL RECORD")
                                    .FontSize(8)
                                    .Medium()
                                    .FontColor(Colors.Grey.Medium)
                                    .LetterSpacing(0.2f);
                            });

                        row.RelativeItem()
                            .AlignRight()
                            .Column(col =>
                            {
                                col.Item()
                                    .Text($"{patient.FirstName} {patient.LastName}")
                                    .FontSize(12)
                                    .Bold();
                                col.Item()
                                    .Text($"MRN: {patient.Mrn} | DOB: {patient.Dob:MMM dd, yyyy}")
                                    .FontSize(8)
                                    .FontColor(Colors.Grey.Darken1);
                                col.Item()
                                    .Text(
                                        $"ENCOUNTER DATE: {(encounter != null ? encounter.EncounterDate.ToString("MMM dd, yyyy HH:mm") : "N/A")}"
                                    )
                                    .FontSize(7)
                                    .FontColor(Colors.Grey.Medium);
                            });
                    });

                page.Content()
                    .PaddingVertical(20)
                    .Column(col =>
                    {
                        // Section 1: Provider & Attendance
                        col.Item()
                            .PaddingBottom(20)
                            .Row(row =>
                            {
                                row.RelativeItem()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("ATTENDING PRACTITIONER")
                                            .FontSize(7)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        c.Item()
                                            .PaddingTop(2)
                                            .Text(
                                                encounter != null ? $"{encounter.Practitioner?.FirstName} {encounter.Practitioner?.LastName}" : "Unassigned"
                                            )
                                            .FontSize(10)
                                            .SemiBold();
                                        c.Item()
                                            .Text(encounter?.Practitioner?.Position.ToString() ?? "N/A")
                                            .FontSize(8)
                                            .Italic()
                                            .FontColor(Colors.Grey.Medium);
                                    });

                                row.RelativeItem()
                                    .AlignRight()
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Text("ENCOUNTER TYPE")
                                            .FontSize(7)
                                            .Bold()
                                            .FontColor(Colors.Teal.Medium);
                                        c.Item()
                                            .PaddingTop(2)
                                            .Text(encounter?.Type.ToString()?.Replace("_", " ") ?? "N/A")
                                            .FontSize(10)
                                            .Bold();
                                    });
                            });

                        // Section 2: Physiological Markers (Vitals)
                        col.Item()
                            .PaddingBottom(10)
                            .Text("PHYSIOLOGICAL MARKERS")
                            .FontSize(8)
                            .Bold()
                            .FontColor(Colors.Teal.Medium);
                        col.Item()
                            .PaddingBottom(20)
                            .Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Header(header =>
                                {
                                    header
                                        .Cell()
                                        .Background(Colors.Grey.Lighten4)
                                        .Padding(5)
                                        .Text("HEART RATE")
                                        .FontSize(7)
                                        .Bold();
                                    header
                                        .Cell()
                                        .Background(Colors.Grey.Lighten4)
                                        .Padding(5)
                                        .Text("BLOOD PRESSURE")
                                        .FontSize(7)
                                        .Bold();
                                    header
                                        .Cell()
                                        .Background(Colors.Grey.Lighten4)
                                        .Padding(5)
                                        .Text("TEMPERATURE")
                                        .FontSize(7)
                                        .Bold();
                                    header
                                        .Cell()
                                        .Background(Colors.Grey.Lighten4)
                                        .Padding(5)
                                        .Text("OXYGEN SAT")
                                        .FontSize(7)
                                        .Bold();
                                });

                                var v = encounter?.VitalSigns?.FirstOrDefault();
                                table
                                    .Cell()
                                    .Padding(5)
                                    .Text(v?.HeartRate > 0 ? $"{v.HeartRate} BPM" : "0 BPM")
                                    .FontSize(9);
                                table
                                    .Cell()
                                    .Padding(5)
                                    .Text(
                                        v?.BloodPressureSystolic > 0
                                            ? $"{v.BloodPressureSystolic}/{v.BloodPressureDiastolic} mmHg"
                                            : "0/0 mmHg"
                                    )
                                    .FontSize(9);
                                table
                                    .Cell()
                                    .Padding(5)
                                    .Text(v?.Temperature > 0 ? $"{v.Temperature}°F" : "0°F")
                                    .FontSize(9);
                                table
                                    .Cell()
                                    .Padding(5)
                                    .Text(
                                        v?.OxygenSaturation > 0
                                            ? $"{v.OxygenSaturation}% SpO2"
                                            : "0% SpO2"
                                    )
                                    .FontSize(9);
                            });

                        // Section 3: Clinical Assessments (Dynamic)
                        if (assessments.Any())
                        {
                            col.Item()
                                .PaddingBottom(10)
                                .Text("CLINICAL ASSESSMENTS")
                                .FontSize(8)
                                .Bold()
                                .FontColor(Colors.Teal.Medium);
                            foreach (var assessment in assessments)
                            {
                                col.Item()
                                    .PaddingBottom(10)
                                    .Border(0.5f)
                                    .BorderColor(Colors.Grey.Lighten3)
                                    .Padding(8)
                                    .Column(c =>
                                    {
                                        c.Item()
                                            .Row(r =>
                                            {
                                                r.RelativeItem()
                                                    .Text(assessment.Questionnaire?.Name.ToUpper())
                                                    .FontSize(8)
                                                    .Bold();
                                                if (assessment.TotalScore.HasValue)
                                                    r.RelativeItem()
                                                        .AlignRight()
                                                        .Text(
                                                            $"TOTAL SCORE: {assessment.TotalScore}"
                                                        )
                                                        .FontSize(8)
                                                        .Bold()
                                                        .FontColor(Colors.Teal.Medium);
                                            });
                                        
                                        if (!string.IsNullOrEmpty(assessment.Questionnaire?.Description))
                                        {
                                            c.Item()
                                                .PaddingTop(2)
                                                .Text(assessment.Questionnaire.Description)
                                                .FontSize(7)
                                                .Italic()
                                                .FontColor(Colors.Grey.Medium);
                                        }

                                        c.Item()
                                            .PaddingTop(4)
                                            .Text(t => {
                                                t.Span("COMPLETED BY: ").FontSize(7).Bold().FontColor(Colors.Grey.Medium);
                                                t.Span($"{assessment.Assessor?.FirstName} {assessment.Assessor?.LastName}").FontSize(7).Medium();
                                                t.Span(" | ").FontSize(7).FontColor(Colors.Grey.Lighten1);
                                                t.Span(assessment.CompletedAt.ToString("MMM dd, yyyy HH:mm")).FontSize(7);
                                            });
                                    });
                            }
                            col.Item().PaddingBottom(10);
                        }

                        // Section 3b: Symptom Burden Analysis (Legacy ESAS)
                        if (esas != null)
                        {
                            col.Item()
                                .PaddingBottom(10)
                                .Text("SYMPTOM BURDEN ANALYSIS (ESAS-R)")
                                .FontSize(8)
                                .Bold()
                                .FontColor(Colors.Teal.Medium);
                            col.Item()
                                .PaddingBottom(20)
                                .Grid(grid =>
                                {
                                    grid.Columns(3);
                                    grid.Spacing(10);

                                    AddSymptomItem(grid, "PAIN", esas.Pain);
                                    AddSymptomItem(grid, "NAUSEA", esas.Nausea);
                                    AddSymptomItem(grid, "ANXIETY", esas.Anxiety);
                                    AddSymptomItem(grid, "DEPRESSION", esas.Depression);
                                    AddSymptomItem(grid, "SOB", esas.ShortnessOfBreath);
                                    AddSymptomItem(grid, "WELLBEING", esas.Wellbeing);
                                });
                        }

                        // Section 4: Clinical Narrative
                        col.Item()
                            .PaddingBottom(10)
                            .Text("CLINICAL NARRATIVE")
                            .FontSize(8)
                            .Bold()
                            .FontColor(Colors.Teal.Medium);
                        foreach (var note in encounter?.ClinicalNotes ?? new List<ClinicalNote>())
                        {
                            col.Item()
                                .PaddingBottom(10)
                                .Background(Colors.Grey.Lighten5)
                                .Padding(10)
                                .Column(c =>
                                {
                                    c.Item()
                                        .Text(note.Type.ToString().ToUpper())
                                        .FontSize(7)
                                        .Bold()
                                        .FontColor(Colors.Teal.Medium);
                                    c.Item()
                                        .PaddingTop(2)
                                        .Text(t => t.Span(note.Content).FontSize(9).Italic());
                                });
                        }

                        // Section 5: Billing & Financial Summary (If exists)
                        if (invoice != null)
                        {
                            col.Item()
                                .PaddingTop(10)
                                .PaddingBottom(10)
                                .Text("BILLING & FINANCIAL SUMMARY")
                                .FontSize(8)
                                .Bold()
                                .FontColor(Colors.Teal.Medium);
                            AddBillingTable(col, invoice);
                        }
                    });

                // Footer - Attestation
                page.Footer()
                    .PaddingTop(20)
                    .DefaultTextStyle(x => x.FontSize(7).FontColor(Colors.Grey.Darken1))
                    .Column(footer =>
                    {
                        footer.Item().LineHorizontal(1).LineColor(Colors.Teal.Medium);
                        footer
                            .Item()
                            .PaddingTop(5)
                            .Text(t =>
                            {
                                t.Span("ELECTRONIC ATTESTATION: ").Bold();
                                t.Span(
                                    $"I certify that the clinical services described were rendered by me on {encounter?.EncounterDate:MMM dd, yyyy}. Signature: "
                                );
                                t.Span(
                                        $"{encounter?.Practitioner?.FirstName} {encounter?.Practitioner?.LastName}"
                                    )
                                    .FontSize(8)
                                    .Bold()
                                    .Italic();
                            });
                    });
            });
        });

        return document.GeneratePdf();
    }

    private void AddSymptomItem(GridDescriptor grid, string label, int value)
    {
        grid.Item()
            .Row(row =>
            {
                row.AutoItem()
                    .PaddingTop(2)
                    .Background(
                        value > 7 ? Colors.Red.Medium
                        : value > 3 ? Colors.Orange.Medium
                        : Colors.Green.Medium
                    )
                    .Width(6)
                    .Height(6);
                row.RelativeItem()
                    .PaddingLeft(5)
                    .Column(c =>
                    {
                        c.Item().Text(label).FontSize(7).Bold();
                        c.Item().Text($"{value}/10").FontSize(8);
                    });
            });
    }
}
