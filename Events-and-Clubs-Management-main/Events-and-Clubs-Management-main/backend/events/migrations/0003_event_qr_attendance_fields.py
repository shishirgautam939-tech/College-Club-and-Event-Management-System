from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_add_venue_max_participants'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='attendance_qr_active',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='event',
            name='attendance_qr_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='attendance_qr_token',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
    ]
