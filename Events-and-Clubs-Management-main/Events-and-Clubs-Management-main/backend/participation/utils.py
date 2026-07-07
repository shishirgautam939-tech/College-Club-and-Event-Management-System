import io
import json
import uuid
from datetime import timedelta

from django.core.files.base import ContentFile
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Flowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from clubs.models import ClubMember
from .models import Attendance, Certificate, EventRegistration


def generate_attendance_token():
    return uuid.uuid4().hex


def build_qr_payload(event_id, token):
    return f"event-attendance://{event_id}/{token}"


def decode_qr_payload(payload):
    if not payload:
        raise ValueError("QR payload is empty")

    if isinstance(payload, str):
        text = payload.strip()
        if text.startswith("event-attendance://"):
            _, remainder = text.split("event-attendance://", 1)
            if "/" not in remainder:
                raise ValueError("QR payload is malformed")
            event_id_text, token = remainder.split("/", 1)
            return {"event_id": int(event_id_text), "token": token}

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return {
                    "event_id": int(parsed["event_id"]),
                    "token": parsed["token"],
                }
        except (json.JSONDecodeError, TypeError, KeyError, ValueError):
            raise ValueError("QR payload is not valid")

    raise ValueError("QR payload is not valid")


def can_manage_event_attendance(user, event):
    is_admin = user.is_staff or getattr(user, 'user_type', None) == 'Admin'
    is_coordinator = event.club and event.club.faculty_coordinator == user
    is_creator = event.created_by == user
    return is_admin or is_coordinator or is_creator


def activate_event_qr(event, hours_valid=6):
    event.attendance_qr_token = generate_attendance_token()
    event.attendance_qr_expires_at = timezone.now() + timedelta(hours=hours_valid)
    event.attendance_qr_active = True
    event.save(update_fields=[
        'attendance_qr_token',
        'attendance_qr_expires_at',
        'attendance_qr_active',
    ])
    return event


def ensure_event_qr_active(event, hours_valid=None):
    """
    Activate the QR for an event if it has no live token.
    No-op when an active token already exists, so a manager rotating the
    token mid-event is never overwritten. Default validity spans from now
    until the event start (min 6h, capped at 30 days).
    """
    if event.attendance_qr_token and is_event_qr_active(event):
        return event
    if hours_valid is None:
        try:
            delta = event.event_date - timezone.now()
            hours = int(delta.total_seconds() // 3600)
        except TypeError:
            hours = 24
        # At least 6h so a same-day activation is useful, cap at 30 days
        hours = max(6, min(hours or 24, 24 * 30))
    else:
        hours = hours_valid
    return activate_event_qr(event, hours_valid=hours)


def is_event_qr_active(event):
    if not event.attendance_qr_active:
        return False
    if event.attendance_qr_expires_at and timezone.now() > event.attendance_qr_expires_at:
        event.attendance_qr_active = False
        event.save(update_fields=['attendance_qr_active'])
        return False
    return True


def deactivate_event_qr(event):
    event.attendance_qr_active = False
    event.save(update_fields=['attendance_qr_active'])


def verify_qr_token(event, token):
    if event.status != 'Approved':
        return False, 'Attendance can only be marked for approved events.'
    if not is_event_qr_active(event):
        return False, 'QR attendance is not active for this event.'
    if not event.attendance_qr_token or event.attendance_qr_token != token:
        return False, 'Invalid or expired QR code.'
    if event.attendance_qr_expires_at and timezone.now() > event.attendance_qr_expires_at:
        return False, 'This QR code has expired. Ask the organizer to refresh it.'
    return True, ''


def normalize_datetime(value):
    if value is None:
        return None
    if isinstance(value, str):
        parsed = parse_datetime(value)
        if parsed is not None:
            value = parsed
    if timezone.is_naive(value):
        return timezone.make_aware(value)
    return value


class NCELogo(Flowable):
    def __init__(self, width=1.5 * inch, height=0.8 * inch):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.HexColor('#1D4732'))
        c.circle(self.width * 0.27, self.height * 0.48, self.height * 0.35, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont('Helvetica-Bold', 18)
        c.drawCentredString(self.width * 0.27, self.height * 0.55, 'NCE')
        c.setFont('Helvetica', 6)
        c.drawCentredString(self.width * 0.27, self.height * 0.36, 'College Club')
        c.drawCentredString(self.width * 0.27, self.height * 0.26, 'Management')
        c.restoreState()


def build_certificate_pdf(certificate):
    buffer = io.BytesIO()
    page_size = landscape(A4)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch,
    )

    styles = getSampleStyleSheet()
    header_style = ParagraphStyle(
        'CertHeader',
        parent=styles['Heading2'],
        fontSize=16,
        leading=18,
        alignment=1,
        textColor=colors.HexColor('#1C3A55'),
        spaceAfter=6,
    )
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Title'],
        fontSize=38,
        leading=42,
        alignment=1,
        textColor=colors.HexColor('#1C3A55'),
        spaceAfter=10,
    )
    sub_title_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Heading4'],
        fontSize=14,
        leading=18,
        alignment=1,
        textColor=colors.HexColor('#4A5568'),
        spaceAfter=14,
    )
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Heading1'],
        fontSize=36,
        leading=42,
        alignment=1,
        textColor=colors.HexColor('#17233D'),
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontSize=16,
        leading=24,
        alignment=1,
        textColor=colors.HexColor('#2F3A4A'),
        spaceAfter=6,
    )
    highlight_style = ParagraphStyle(
        'CertHighlight',
        parent=styles['Heading4'],
        fontSize=20,
        leading=24,
        alignment=1,
        textColor=colors.HexColor('#16393C'),
        spaceAfter=8,
    )
    footer_style = ParagraphStyle(
        'CertFooter',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#5A5A5A'),
    )

    event = certificate.event
    user = certificate.user
    club_name = event.club.club_name if event.club else 'NCE Club'
    event_date_value = normalize_datetime(event.event_date)
    event_date = timezone.localtime(event_date_value).strftime('%B %d, %Y') if event_date_value else 'TBD'

    principal_name = 'Prof. Dr. Arbind Kumar Mishra'
    president_name = 'Club Head President'
    if event.club:
        president_record = ClubMember.objects.filter(
            club=event.club,
            position__iexact='President'
        ).select_related('user').first()
        if president_record and president_record.user and president_record.user.full_name:
            president_name = president_record.user.full_name

    logo = NCELogo(width=1.5 * inch, height=0.8 * inch)
    story = [
        Spacer(1, 0.2 * inch),
        Table(
            [[logo, Paragraph('<b>NATIONAL COLLEGE OF ENGINEERING</b>', header_style), '']],
            colWidths=[1.8 * inch, 7.6 * inch, 0.2 * inch],
            style=TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (1, 0), 'CENTER'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]),
        ),
        Paragraph('College Club and Event Management System', sub_title_style),
        Spacer(1, 0.2 * inch),
        Paragraph('<b>CERTIFICATE OF PARTICIPATION</b>', title_style),
        Paragraph('This is to certify that', body_style),
        Paragraph(f'<b>{user.full_name}</b>', name_style),
        Paragraph(
            f'has successfully participated in <b>{event.title}</b> organized by <b>{club_name}</b> on <b>{event_date}</b>.',
            body_style,
        ),
        Spacer(1, 0.6 * inch),
    ]

    signature_table = Table(
        [
            [
                Paragraph(f'<b>{principal_name}</b>', body_style),
                Paragraph('<b>HEAD OF DEPARTMENT</b>', body_style),
                Paragraph(f'<b>{president_name}</b>', body_style),
            ],
            [
                Paragraph('PRINCIPAL', footer_style),
                Paragraph('HEAD OF DEPARTMENT', footer_style),
                Paragraph('CLUB HEAD PRESIDENT', footer_style),
            ],
        ],
        colWidths=[3.0 * inch, 3.0 * inch, 3.0 * inch],
        style=TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, 0), 'BOTTOM'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('NOSPLIT', (0, 0), (-1, -1)),
        ]),
    )

    story.extend([
        Spacer(1, 0.6 * inch),
        signature_table,
        Spacer(1, 0.25 * inch),
        Paragraph(f'Certificate ID: {certificate.certificate_code}', footer_style),
        Paragraph(f'Issued on {timezone.localtime(certificate.issued_at).strftime("%B %d, %Y")}', footer_style),
    ])

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def issue_certificate_for_attendee(event, user):
    has_attendance = Attendance.objects.filter(event=event, user=user, present=True).exists()
    is_registered = event.registrations.filter(user=user).exists()
    if not has_attendance and not (event.status == 'Completed' and is_registered):
        return None

    certificate, created = Certificate.objects.get_or_create(event=event, user=user)
    if not certificate.pdf_file or created:
        pdf_bytes = build_certificate_pdf(certificate)
        filename = f'certificate_{event.id}_{user.id}_{certificate.certificate_code}.pdf'
        certificate.pdf_file.save(filename, ContentFile(pdf_bytes), save=True)
    return certificate


def issue_certificates_for_event(event):
    if event.status == 'Completed':
        registrants = EventRegistration.objects.filter(event=event).select_related('user')
        target_users = [registration.user for registration in registrants]
    else:
        present_attendees = Attendance.objects.filter(event=event, present=True).select_related('user')
        target_users = [attendance.user for attendance in present_attendees]

    issued = []
    for user in target_users:
        certificate = issue_certificate_for_attendee(event, user)
        if certificate:
            issued.append(certificate)
    return issued
