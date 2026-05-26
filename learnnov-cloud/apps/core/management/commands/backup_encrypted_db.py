import os
import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from cryptography.fernet import Fernet
from django.core.management import call_command
import tempfile

class Command(BaseCommand):
    help = 'Create an encrypted database backup (DB03)'

    def handle(self, *args, **kwargs):
        # Generate or use an existing Fernet key
        # In a real production scenario, this key should be loaded securely from an environment variable!
        backup_key = os.getenv('DB_BACKUP_KEY')
        if not backup_key:
            backup_key = Fernet.generate_key().decode('utf-8')
            self.stdout.write(self.style.WARNING(f"No DB_BACKUP_KEY found in env. Generated a new one: {backup_key}"))
            self.stdout.write(self.style.WARNING("SAVE THIS KEY! You will not be able to decrypt the backup without it."))

        cipher_suite = Fernet(backup_key.encode('utf-8'))

        backups_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backups_dir, exist_ok=True)

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        encrypted_filename = os.path.join(backups_dir, f'db_backup_{timestamp}.json.enc')

        # Create a temporary file for the unencrypted dump
        fd, temp_path = tempfile.mkstemp()
        try:
            self.stdout.write("Dumping database to temporary file...")
            with open(temp_path, 'w', encoding='utf-8') as f:
                call_command('dumpdata', stdout=f)
            
            self.stdout.write("Encrypting backup using AES-256 (Fernet)...")
            with open(temp_path, 'rb') as f:
                plaintext_data = f.read()

            encrypted_data = cipher_suite.encrypt(plaintext_data)

            with open(encrypted_filename, 'wb') as f:
                f.write(encrypted_data)

            self.stdout.write(self.style.SUCCESS(f'Successfully backed up and encrypted database to: {encrypted_filename}'))
        
        finally:
            os.close(fd)
            if os.path.exists(temp_path):
                os.remove(temp_path)
