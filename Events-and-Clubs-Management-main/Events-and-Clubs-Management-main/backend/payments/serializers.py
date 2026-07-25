from rest_framework import serializers

from .models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Read-only view of a payment transaction for the student/admin."""
    event_title = serializers.CharField(source='event.title', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'pidx',
            'transaction_id',
            'purchase_order_id',
            'event',
            'event_title',
            'user',
            'user_name',
            'user_email',
            'amount',
            'amount_paisa',
            'status',
            'payment_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields
