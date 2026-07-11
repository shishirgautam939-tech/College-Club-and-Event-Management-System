

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

import re

# A stricter email regex. The local part is 1-64 chars from the
# standard set. The domain is a sequence of dot-separated labels
# (1-63 chars each) and ends in `.com` or `.edu`. The TLD is
# anchored separately so it cannot be greedily absorbed into the
# previous label.
EMAIL_DOMAIN_PATTERN = re.compile(
    r'^[A-Za-z0-9._%+\-]{1,64}@'
    r'(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+'
    r'(?:com|edu)$'
)

# Reject common typos by requiring realistic second-level lengths.
# - .com providers like gmail.com need at least 5 chars before ".com"
#   so typos like gmai.com do not pass.
# - .edu school domains can be shorter, so nce.edu still works.
MIN_SECOND_LEVEL_DOMAIN_LENGTHS = {
    'com': 5,
    'edu': 3,
}


def validate_email_domain(value):
    email = (value or '').strip()
    if not EMAIL_DOMAIN_PATTERN.match(email):
        raise serializers.ValidationError(
            'Enter a valid email address ending with .com or .edu (e.g. name@gmail.com or name@nce.edu).'
        )
    # Pull out the second-level domain (the label right before the
    # TLD) and require it to be long enough for that TLD.
    try:
        domain_part = email.rsplit('@', 1)[1]
        second_level, tld = domain_part.rsplit('.', 1)
        second_level = second_level.split('.')[-1]
    except (IndexError, ValueError):
        raise serializers.ValidationError('Enter a valid email address.')
    min_length = MIN_SECOND_LEVEL_DOMAIN_LENGTHS.get(tld.lower())
    if min_length and len(second_level) < min_length:
        raise serializers.ValidationError(
            'That email domain looks incomplete. Use a full provider '
            'name like gmail.com, outlook.com, or your college\'s .edu address.'
        )
    return email


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source='department.department_name', read_only=True
    )

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'user_type', 'department', 'department_name', 'branch', 'roll_number', 'is_active', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        return validate_email_domain(value)

    def validate(self, data):
        user_type = data.get('user_type')
        roll_number = data.get('roll_number')

        if user_type == 'Student':
            if not roll_number:
                raise serializers.ValidationError({"roll_number": "Roll number is required for students."})
            
            # Format: NCE0 + 2-digit year + branch (BCT/BCE/BEE/BEI) + 0 + 2-digit roll
            pattern = r'^NCE0(\d{2})(BCT|BCE|BEE|BEI)0(\d{2})$'
            match = re.match(pattern, roll_number.upper())
            if not match:
                raise serializers.ValidationError({
                    "roll_number": "Invalid format. Must be NCE0XXBRANCH0XX where XX=batch year, BRANCH=BCT/BCE/BEE/BEI, XX=roll no (e.g., NCE078BCT012)."
                })
            # Auto-map branch from roll number
            data['branch'] = match.group(2)
            data['roll_number'] = roll_number.upper()
        
        return data

    def create(self, validated_data):
        # This is crucial: it uses the UserManager we wrote in models.py 
        # to hash the password properly.
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing user (password optional)."""
    department_name = serializers.CharField(
        source='department.department_name', read_only=True
    )

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'user_type', 'department', 'department_name', 'branch', 'roll_number', 'is_active', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }

    def validate_email(self, value):
        return validate_email_domain(value)

    def validate(self, data):
        user_type = data.get('user_type', self.instance.user_type if self.instance else None)
        roll_number = data.get('roll_number', self.instance.roll_number if self.instance else None)

        if user_type == 'Student' and roll_number:
            pattern = r'^NCE0(\d{2})(BCT|BCE|BEE|BEI)0(\d{2})$'
            match = re.match(pattern, roll_number.upper())
            if not match:
                raise serializers.ValidationError({
                    "roll_number": "Invalid format. Must be NCE0XXBRANCH0XX (e.g., NCE078BCT012)."
                })
            # Auto-map branch from roll number
            data['branch'] = match.group(2)
            data['roll_number'] = roll_number.upper()
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # These are encoded INSIDE the token (good for security checks)
        token['full_name'] = user.full_name
        token['user_type'] = user.user_type
        return token

    def validate(self, attrs):
        # Allow login with email, roll_number, or full_name
        identifier = attrs.get('email', '')
        if identifier and '@' not in identifier:
            # Not an email — try roll_number first, then full_name
            user = (
                User.objects.filter(roll_number__iexact=identifier).first()
                or User.objects.filter(full_name__iexact=identifier).first()
            )
            if user:
                attrs['email'] = user.email

        data = super().validate(attrs)

        # This adds plain text data to the JSON response 
        # (easy for React to read without decoding the JWT)
        data['full_name'] = self.user.full_name
        data['user_type'] = self.user.user_type
        data['id'] = self.user.id
        
        return data
