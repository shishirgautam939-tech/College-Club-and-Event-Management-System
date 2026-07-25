from django.db import models

from accounts.models import User
from events.models import Event


class PaymentTransaction(models.Model):
    """A single Khalti e-Payment attempt for an event registration.

    One row is created the moment a payment is initiated (status ``Initiated``)
    and is updated in place as the payment moves through Khalti's lifecycle.
    The ``pidx`` returned by Khalti is our stable handle for every later
    lookup/verification, so it is unique and required.
    """

    STATUS_INITIATED = 'Initiated'
    STATUS_PENDING = 'Pending'
    STATUS_COMPLETED = 'Completed'
    STATUS_FAILED = 'Failed'
    STATUS_CANCELLED = 'Cancelled'
    STATUS_EXPIRED = 'Expired'
    STATUS_REFUNDED = 'Refunded'

    STATUS_CHOICES = (
        (STATUS_INITIATED, 'Initiated'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_REFUNDED, 'Refunded'),
    )

    # How Khalti's lookup `status` strings map onto our internal status.
    KHALTI_STATUS_MAP = {
        'Completed': STATUS_COMPLETED,
        'Pending': STATUS_PENDING,
        'Initiated': STATUS_INITIATED,
        'Refunded': STATUS_REFUNDED,
        'Expired': STATUS_EXPIRED,
        'User canceled': STATUS_CANCELLED,
        'Canceled': STATUS_CANCELLED,
        'Failed': STATUS_FAILED,
    }

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='payment_transactions')
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name='payment_transactions')

    # Khalti payment identifier (returned from /epayment/initiate/). This is
    # what we send to /epayment/lookup/ to verify the payment server-side.
    pidx = models.CharField(max_length=128, unique=True, db_index=True)

    # Khalti's transaction id — only present once the payment is Completed.
    transaction_id = models.CharField(max_length=128, blank=True, null=True)

    # Our own order id sent to Khalti as purchase_order_id.
    purchase_order_id = models.CharField(max_length=128, unique=True)

    # Amount stored redundantly in both rupees (for display/reporting) and
    # paisa (what Khalti actually charges) so we never re-derive with float math.
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paisa = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_INITIATED)

    payment_url = models.URLField(max_length=500, blank=True, default='')

    # Full response bodies from Khalti kept for auditing / debugging.
    initiate_response = models.JSONField(blank=True, null=True)
    verification_response = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Transaction'
        indexes = [
            models.Index(fields=['user', 'event']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.user.email} · {self.event.title} · {self.amount} NPR · {self.status}'

    @property
    def is_completed(self):
        return self.status == self.STATUS_COMPLETED
