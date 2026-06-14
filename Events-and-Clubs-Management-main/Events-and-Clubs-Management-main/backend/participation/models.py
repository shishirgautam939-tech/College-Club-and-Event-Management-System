from django.db import models
from accounts.models import User
from events.models import Event


class EventRegistration(models.Model):
    # Django will create a standard 'id' automatically
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='event_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # This ensures a user can't register for the same event twice
        unique_together = ('event', 'user')
        verbose_name = "Event Registration"

    def __str__(self):
        return f"{self.user.full_name} -> {self.event.title}"


class Attendance(models.Model):
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='attendance_records')
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='attended_events')
    present = models.BooleanField(default=False)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

    def __str__(self):
        status = "Present" if self.present else "Absent"
        return f"{self.user.full_name} at {self.event.title}: {status}"
