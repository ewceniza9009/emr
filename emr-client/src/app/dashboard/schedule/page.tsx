import SchedulingCalendar from "@/components/SchedulingCalendar";

export const metadata = {
  title: "Clinical Schedule | CareNavigator EMR",
  description: "Weekly clinical scheduling view for care navigators, clinicians, and support staff.",
};

export default function SchedulePage() {
  return <SchedulingCalendar />;
}
