from django.test import TestCase
from apps.academic_programs.serializers import AcademicProgramDetailSerializer

class AcademicProgramSanitizationTests(TestCase):
    def test_xss_sanitization_in_program_description(self):
        # The malicious payload
        malicious_html = '<p>Welcome</p><script>alert("Hacked!");</script><a href="javascript:alert(1)">Click</a>'
        
        # Test the serializer validate_description method directly
        serializer = AcademicProgramDetailSerializer()
        
        cleaned_html = serializer.validate_description(malicious_html)
        
        # The script tag should be removed by bleach
        self.assertNotIn('<script>', cleaned_html)
        self.assertNotIn('alert("Hacked!");', cleaned_html)
        # The <p> tag should be kept
        self.assertIn('<p>Welcome</p>', cleaned_html)
