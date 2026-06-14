import io
import uuid
from datetime import timedelta

from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from .models import Attendance, Certificate


def generate_attendance_token():
    return uuid.uuid4().hex


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


def deactivate_event_qr(event):
    event.attendance_qr_active = False
    event.save(update_fields=['attendance_qr_active'])


def verify_qr_token(event, token):
    if not event.attendance_qr_active:
        return False, 'QR attendance is not active for this event.'
    if not event.attendance_qr_token or event.attendance_qr_token != token:
        return False, 'Invalid or expired QR code.'
    if event.attendance_qr_expires_at and timezone.now() > event.attendance_qr_expires_at:
        return False, 'This QR code has expired. Ask the organizer to refresh it.'
    if event.status != 'Approved':
        return False, 'Attendance can only be marked for approved events.'
    return True, ''


def build_certificate_pdf(certificate):
    buffer = io.BytesIO()
    page_size = landscape(A4)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=page_size,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Title'],
        fontSize=30,
        textColor=colors.HexColor('#2F5233'),
        spaceAfter=12,
        alignment=1,
    )
    subtitle_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#5C6B5E'),
        spaceAfter=24,
        alignment=1,
    )
    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontSize=16,
        leading=24,
        textColor=colors.HexColor('#374151'),
        alignment=1,
    )
    footer_style = ParagraphStyle(
        'CertFooter',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#6B7280'),
        alignment=1,
    )

    event = certificate.event
    user = certificate.user
    club_name = event.club.club_name if event.club else 'College'
    event_date = timezone.localtime(event.event_date).strftime('%B %d, %Y')

    story = [
        Spacer(1, 0.4 * inch),
        Paragraph('Certificate of Participation', title_style),
        Paragraph('Events &amp; Clubs Management Portal', subtitle_style),
        Spacer(1, 0.2 * inch),
        Paragraph('This is to certify that', body_style),
        Spacer(1, 0.15 * inch),
        Paragraph(f'<b>{user.full_name}</b>', body_style),
        Spacer(1, 0.15 * inch),
        Paragraph(
            f'has successfully participated in <b>{event.title}</b> '
            f'organized by <b>{club_name}</b> on <b>{event_date}</b>.',
            body_style,
        ),
        Spacer(1, 0.35 * inch),
        Paragraph(f'Certificate ID: {certificate.certificate_code}', footer_style),
        Paragraph(f'Issued on {timezone.localtime(certificate.issued_at).strftime("%B %d, %Y")}', footer_style),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def issue_certificate_for_attendee(event, user):
    attendance = Attendance.objects.filter(event=event, user=user, present=True).first()
    if not attendance:
        return None

    certificate, created = Certificate.objects.get_or_create(event=event, user=user)
    if not certificate.pdf_file or created:
        pdf_bytes = build_certificate_pdf(certificate)
        filename = f'certificate_{event.id}_{user.id}_{certificate.certificate_code}.pdf'
        certificate.pdf_file.save(filename, ContentFile(pdf_bytes), save=True)
    return certificate


def issue_certificates_for_event(event):
    present_attendees = Attendance.objects.filter(event=event, present=True).select_related('user')
    issued = []
    for attendance in present_attendees:
        certificate = issue_certificate_for_attendee(event, attendance.user)
        if certificate:
            issued.append(certificate)
    return issued
