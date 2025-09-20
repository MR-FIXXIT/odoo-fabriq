from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.request import Request
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class CustomCookieJWTAuthentication(JWTAuthentication):
    """
    An authentication plugin that authenticates requests using a JWT from a cookie.
    Reads cookie names from settings.SIMPLE_JWT.
    """
    def authenticate(self, request: Request):
        header = self.get_header(request)

        if header is None:
            # Try to get the token from the cookie
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
            if raw_token is None:
                return None # No token found in header or cookie

            try:
                validated_token = self.get_validated_token(raw_token)
            except (InvalidToken, TokenError) as e:
                raise InvalidToken(_('Given token not valid for any token type') + ': ' + str(e))

            return self.get_user(validated_token), validated_token

        # If header is present, fall back to default JWTAuthentication behavior
        return super().authenticate(request)

    def get_validated_token(self, raw_token):
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object.
        """
        messages = []
        for AuthToken in self.user_token_classes:
            try:
                return AuthToken(raw_token)
            except TokenError as e:
                messages.append({'token_class': AuthToken.__name__, 'message': str(e)})

        raise InvalidToken({
            'detail': _('Given token not valid for any token type'),
            'messages': messages,
        })