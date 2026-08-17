from rest_framework import authentication, exceptions

from .models import AuthToken, StaffUser


class StaffTokenAuthentication(authentication.BaseAuthentication):
    keyword = 'Token'

    def authenticate(self, request):
        auth = authentication.get_authorization_header(request).decode('utf-8')
        if not auth:
            return None

        parts = auth.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token_key = parts[1]
        try:
            token = AuthToken.objects.select_related('user').get(key=token_key)
        except AuthToken.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed('Invalid authentication token.') from exc

        user = token.user
        if not user.is_active:
            raise exceptions.AuthenticationFailed('User account is inactive.')

        return user, token


class StaffUserShim:
    is_authenticated = True

    def __init__(self, staff_user: StaffUser):
        self.staff_user = staff_user

