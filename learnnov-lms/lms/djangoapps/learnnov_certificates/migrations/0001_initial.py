from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='CertificateQRCode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('verify_uuid', models.CharField(db_index=True, max_length=32, unique=True)),
                ('qr_image', models.ImageField(upload_to='certificates/qr/', verbose_name='صورة QR Code')),
                ('verification_url', models.URLField(verbose_name='رابط التحقق')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'verbose_name': 'QR Code شهادة', 'verbose_name_plural': 'QR Codes الشهادات'},
        ),
    ]
