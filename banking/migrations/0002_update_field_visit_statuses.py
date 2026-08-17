from django.db import migrations, models


def migrate_visit_statuses(apps, schema_editor):
    FieldVisit = apps.get_model('banking', 'FieldVisit')
    FieldVisit.objects.filter(status='completed').update(status='visited')
    FieldVisit.objects.filter(status='cancelled').update(status='postponed')


class Migration(migrations.Migration):
    dependencies = [
        ('banking', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(migrate_visit_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='fieldvisit',
            name='status',
            field=models.CharField(
                choices=[('scheduled', 'Scheduled'), ('visited', 'Visited'), ('postponed', 'Postponed')],
                default='scheduled',
                max_length=16,
            ),
        ),
    ]
