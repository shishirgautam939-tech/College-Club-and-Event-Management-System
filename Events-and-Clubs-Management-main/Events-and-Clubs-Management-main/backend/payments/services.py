"""Thin client for Khalti's e-Payment (KPG-2) API.

Reference: https://docs.khalti.com/khalti-epayment/

We deliberately use the standard library ``urllib`` instead of ``requests``
so the integration adds no new dependency to the project. Only two endpoints
are needed for the full flow:

* ``POST {base}/epayment/initiate/`` – start a payment, returns ``pidx`` + ``payment_url``
* ``POST {base}/epayment/lookup/``   – verify a payment's real status server-side

All amounts sent to / received from Khalti are in **paisa** (1 NPR = 100 paisa).
"""

import json
import uuid
import urllib.error
import urllib.request

from django.conf import settings

MOCK_PIDX_PREFIX = 'mock_'


class KhaltiError(Exception):
    """Raised when Khalti returns an error or is unreachable.

    ``detail`` is a human-readable message safe to surface to the client;
    ``payload`` holds the raw error body (if any) for logging.
    """

    def __init__(self, detail, payload=None, status_code=None):
        super().__init__(detail)
        self.detail = detail
        self.payload = payload
        self.status_code = status_code


def _base_url():
    return settings.KHALTI_BASE_URL.rstrip('/')


def _post(path, body):
    """POST ``body`` (dict) as JSON to a Khalti endpoint and return the parsed
    JSON response. Raises :class:`KhaltiError` on transport or API errors."""
    if not settings.KHALTI_SECRET_KEY:
        raise KhaltiError(
            'Payment gateway is not configured. Set KHALTI_SECRET_KEY to your '
            'Khalti sandbox secret key (from https://dev.khalti.com/).'
        )
    url = f'{_base_url()}{path}'
    data = json.dumps(body).encode('utf-8')
    request = urllib.request.Request(
        url,
        data=data,
        method='POST',
        headers={
            'Authorization': f'Key {settings.KHALTI_SECRET_KEY}',
            'Content-Type': 'application/json',
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.KHALTI_TIMEOUT) as resp:
            raw = resp.read().decode('utf-8')
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode('utf-8', errors='replace')
        try:
            payload = json.loads(raw)
        except (ValueError, TypeError):
            payload = {'raw': raw}
        # Khalti returns useful, human-readable messages in these keys.
        detail = (
            payload.get('detail')
            or payload.get('error_key')
            or (payload.get('amount') or [None])[0]
            or f'Khalti request failed (HTTP {exc.code}).'
        )
        raise KhaltiError(str(detail), payload=payload, status_code=exc.code)
    except urllib.error.URLError as exc:
        raise KhaltiError(
            'Could not reach the payment gateway. Please try again in a moment.',
            payload={'reason': str(exc.reason)},
        )
    except (ValueError, TypeError) as exc:
        raise KhaltiError('Received an invalid response from the payment gateway.',
                          payload={'reason': str(exc)})


def _mock_checkout_url(return_url, pidx, amount_paisa):
    """Build the URL of the local dummy checkout page, kept on the same origin
    as the real return URL so it works in local dev and on a deployed host."""
    if '/payment/callback' in return_url:
        base = return_url.rsplit('/payment/callback', 1)[0]
    else:
        base = settings.FRONTEND_URL.rstrip('/')
    return f'{base}/payment/mock?pidx={pidx}&amount={amount_paisa}'


def initiate_payment(*, amount_paisa, purchase_order_id, purchase_order_name,
                     return_url, website_url, customer_info=None):
    """Initiate a Khalti payment.

    Returns the parsed response dict which includes ``pidx``, ``payment_url``
    and ``expires_at``.
    """
    if settings.KHALTI_MOCK_MODE:
        pidx = f'{MOCK_PIDX_PREFIX}{uuid.uuid4().hex}'
        return {
            'pidx': pidx,
            'payment_url': _mock_checkout_url(return_url, pidx, amount_paisa),
            'expires_at': None,
            'mock': True,
        }

    body = {
        'return_url': return_url,
        'website_url': website_url,
        'amount': int(amount_paisa),
        'purchase_order_id': purchase_order_id,
        'purchase_order_name': purchase_order_name,
    }
    if customer_info:
        body['customer_info'] = customer_info

    response = _post('/epayment/initiate/', body)
    if not response.get('pidx') or not response.get('payment_url'):
        raise KhaltiError('Payment gateway did not return a valid payment link.',
                          payload=response)
    return response


def lookup_payment(pidx, mock_status=None):
    """Verify a payment's status with Khalti (server-side).

    Returns the parsed lookup response which includes ``status``,
    ``total_amount``, ``transaction_id`` and ``fee``.

    For a mock transaction (or when mock mode is on), we synthesize the response
    from ``mock_status`` — the outcome the dummy checkout reported — instead of
    calling the gateway. This branch is scoped to mock pidx values, so real
    payments are always verified against Khalti and never trust client input.
    """
    if settings.KHALTI_MOCK_MODE or str(pidx).startswith(MOCK_PIDX_PREFIX):
        status = mock_status or 'Completed'
        completed = status == 'Completed'
        return {
            'pidx': pidx,
            'status': status,
            'transaction_id': f'MOCK-{uuid.uuid4().hex[:12].upper()}' if completed else None,
            'fee': 0,
            'refunded': False,
            'mock': True,
        }
    return _post('/epayment/lookup/', {'pidx': pidx})
