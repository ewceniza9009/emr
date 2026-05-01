using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("appointments");

        builder.HasKey(a => a.AppointmentId);

        builder.Property(a => a.AppointmentId)
               .HasColumnName("appointment_id");

        builder.Property(a => a.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(a => a.VisitType)
               .HasColumnName("visit_type")
               .HasConversion<string>()
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(a => a.Status)
               .HasColumnName("status")
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(a => a.ScheduledStart)
               .HasColumnName("scheduled_start")
               .IsRequired();

        builder.Property(a => a.ScheduledEnd)
               .HasColumnName("scheduled_end")
               .IsRequired();

        builder.Property(a => a.Modality)
               .HasColumnName("modality")
               .HasConversion<string>()
               .IsRequired();

        builder.Property(a => a.MeetingLink)
               .HasColumnName("meeting_link")
               .HasMaxLength(255);

        builder.Property(a => a.PractitionerId)
               .HasColumnName("practitioner_id");

        builder.Property(a => a.TravelTimeMinutes)
               .HasColumnName("travel_time_minutes");

        builder.Property(a => a.DistanceInMiles)
               .HasColumnName("distance_in_miles");

        builder.HasOne(a => a.Patient)
               .WithMany()
               .HasForeignKey(a => a.PatientId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Practitioner)
               .WithMany()
               .HasForeignKey(a => a.PractitionerId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
