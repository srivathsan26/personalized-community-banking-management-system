from rest_framework import serializers

from .models import (
    Account,
    AuditLog,
    CreditCard,
    Customer,
    FieldVisit,
    KYCDocument,
    Loan,
    StaffUser,
    Transaction,
)


class StaffUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StaffUser
        fields = [
            'id',
            'username',
            'password',
            'name',
            'role',
            'branch_code',
            'branch_name',
            'employee_id',
            'is_active',
            'created_at',
            'created_by',
            'assigned_customers',
        ]
        read_only_fields = ['id', 'created_at', 'employee_id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        staff_user = StaffUser(**validated_data)
        staff_user.set_password(password)
        staff_user.save()
        return staff_user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = '__all__'


class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = '__all__'


class FieldVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldVisit
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'


class CreditCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditCard
        fields = '__all__'
