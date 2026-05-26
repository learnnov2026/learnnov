from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('university_ads', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='universityad',
            name='title_ar',
            field=models.CharField(blank=True, max_length=200, verbose_name='Ad Title (Arabic)'),
        ),
        migrations.AddField(
            model_name='universityad',
            name='description_ar',
            field=models.TextField(blank=True, verbose_name='Description (Arabic)'),
        ),
        migrations.AlterField(
            model_name='universityad',
            name='title',
            field=models.CharField(max_length=200, verbose_name='Ad Title (English)'),
        ),
        migrations.AlterField(
            model_name='universityad',
            name='description',
            field=models.TextField(blank=True, verbose_name='Description (English)'),
        ),
        migrations.AlterField(
            model_name='university',
            name='name',
            field=models.CharField(max_length=200, verbose_name='University Name (English)'),
        ),
    ]
