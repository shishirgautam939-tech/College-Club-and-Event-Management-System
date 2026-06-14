import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0003_event_qr_attendance_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('participation', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='attendance',
            name='marked_via_qr',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='Certificate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('certificate_code', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('issued_at', models.DateTimeField(auto_now_add=True)),
                ('pdf_file', models.FileField(blank=True, upload_to='certificates/')),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certificates', to='events.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certificates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('event', 'user')},
            },
        ),
    ]
