using FluentValidation;

namespace Application.Outreach.Commands;

public class FinalizeEnrollmentCommandValidator : AbstractValidator<FinalizeEnrollmentCommand>
{
    public FinalizeEnrollmentCommandValidator()
    {
        RuleFor(v => v.PatientOutreachId)
            .NotEmpty();

        RuleFor(v => v.Modality)
            .NotEmpty();

        RuleFor(v => v.Disposition)
            .NotEmpty();

        RuleFor(v => v.HealthPlanId)
            .NotEmpty();
    }
}
