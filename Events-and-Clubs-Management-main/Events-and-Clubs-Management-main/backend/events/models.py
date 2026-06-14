from django.db import models
from accounts.models import User
from clubs.models import Club


class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    ORGANIZER_CHOICES = (('Club', 'Club'), ('Council',
                         'Council'), ('Department', 'Department'))
    organizer_type = models.CharField(max_length=50, choices=ORGANIZER_CHOICES)

    club = models.ForeignKey(
        Club, on_delete=models.CASCADE, null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_events')

    STATUS_CHOICES = (('Proposed', 'Proposed'), ('Approved', 'Approved'),
                      ('Rejected', 'Rejected'), ('Completed', 'Completed'))
    status = models.CharField(
        max_length=50, choices=STATUS_CHOICES, default='Proposed')

    venue = models.CharField(max_length=255, blank=True, default='')
    max_participants = models.PositiveIntegerField(
        null=True, blank=True,
        help_text='Maximum number of participants. Leave blank for unlimited.'
    )

    event_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class EventApproval(models.Model):
    event = models.OneToOneField(
        Event, on_delete=models.CASCADE, primary_key=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    approved_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)
    decision = models.CharField(max_length=20, choices=(
        ('Approved', 'Approved'), ('Rejected', 'Rejected')))
