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

    # ─── Payment (Khalti) ───────────────────────────────────────────
    # Controlled by the faculty coordinator / HoD. When payment_required is
    # True, students must complete a Khalti payment of `fee` rupees before a
    # registration record is created for them.
    payment_required = models.BooleanField(
        default=False,
        help_text='If enabled, students must pay the fee before registering.'
    )
    fee = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Registration fee in NPR. Only charged when payment is required.'
    )

    event_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    attendance_qr_token = models.CharField(max_length=64, blank=True, null=True, unique=True)
    attendance_qr_expires_at = models.DateTimeField(blank=True, null=True)
    attendance_qr_active = models.BooleanField(default=False)

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
