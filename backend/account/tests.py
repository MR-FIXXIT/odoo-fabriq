import sys
import logging
import jwt
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from .models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken

from django.conf import settings
from .authenticate import JWTAuthentication

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InteractiveAccountTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        if 'test' not in sys.argv:
            cls.test_email = input("Enter your email for testing: ")
            logger.info(f"Using email: {cls.test_email}")
        else:
            cls.test_email = "test@example.com"
        
        cls.test_user = CustomUser.objects.create_user(
            email=cls.test_email,
            password='testpass123',
            loginid='testuser'
        )
        logger.info("Test user created successfully")

    def setUp(self):
        self.client.force_authenticate(user=self.test_user)
        logger.info("Test client authenticated")

    def test_password_reset_flow(self):
        """Test complete password reset flow with OTP"""
        # Step 1: Request OTP
        logger.info("Testing OTP request...")
        url = reverse('otp_request')
        data = {'email': self.test_email}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        logger.info("OTP request successful")
        
        # Step 2: Get OTP from user input
        if 'test' not in sys.argv:
            logger.info("Waiting for OTP input...")
            otp = input("\nCheck your email and enter the OTP: ")
        else:
            otp = "123456"
        
        # Step 3: Verify OTP and reset password
        logger.info("Testing password reset confirmation...")
        url = reverse('password_reset_confirm')
        data = {
            'email': self.test_email,
            'otp': otp,
            'new_password': 'newpass123',
            're_new_password': 'newpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        logger.info("Password reset successful")

    def tearDown(self):
        logger.info("Cleaning up test data...")
        super().tearDown()

class AuthenticationTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass123',
            loginid='testuser'
        )
        self.auth = JWTAuthentication()

    def test_jwt_authentication(self):
        """Test JWT token authentication"""
        # Generate token
        payload = {
            'user_id': self.user.id,
            'email': self.user.email
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        
        # Test authentication
        request = self.client.get('/').wsgi_request
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
        
        authenticated_user = self.auth.authenticate(request)
        self.assertIsNotNone(authenticated_user)
        self.assertEqual(authenticated_user[0], self.user)

class AccountViewTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'loginid': 'testuser',
            'role': 'owner'
        }
        self.user = CustomUser.objects.create_user(**self.user_data)

    def test_user_registration(self):
        url = reverse('register')
        data = {
            'email': 'new@example.com',
            'password': 'newpass123',
            'password2': 'newpass123',
            'loginid': 'newuser'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_user_registration_validation(self):
        """Test user registration validation"""
        url = reverse('register')
        
        # Test password mismatch
        data = {
            'email': 'new@example.com',
            'password': 'newpass123',
            'password2': 'different',
            'loginid': 'newuser',
            'role': 'owner'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test duplicate email
        data['password2'] = data['password']
        data['email'] = self.user_data['email']
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_login_validation(self):
        """Test login validation"""
        url = reverse('token_obtain_pair')
        
        # Test invalid credentials
        response = self.client.post(url, {
            'email': self.user_data['email'],
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test missing fields
        response = self.client.post(url, {
            'email': self.user_data['email']
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh(self):
        """Test token refresh functionality"""
        # First get tokens
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        refresh_token = response.data['refresh']
        
        # Test refresh
        url = reverse('token_refresh')
        response = self.client.post(url, {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_logout(self):
        """Test logout functionality"""
        # Login first
        self.client.force_authenticate(user=self.user)
        
        # Test logout
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify authentication required endpoints are inaccessible
        url = reverse('load_users')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TokenTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass123',
            loginid='testuser'
        )
        self.tokens = RefreshToken.for_user(self.user)

    def test_token_refresh(self):
        """Test JWT token refresh functionality"""
        url = reverse('token_refresh')
        data = {'refresh': str(self.tokens)}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_token_blacklist(self):
        """Test token blacklisting on logout"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.tokens.access_token}')
        
        url = reverse('logout')
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify token is blacklisted
        refresh_url = reverse('token_refresh')
        response = self.client.post(refresh_url, {'refresh': str(self.tokens)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
