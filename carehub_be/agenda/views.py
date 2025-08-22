from django.utils.dateparse import parse_datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserOfficeRole
from offices.models import Office
from .models import Agenda
from .serializers import AgendaSerializer
from subscriptions.permissions import RequireActiveSubscription

class AgendaViewSet(viewsets.ModelViewSet):
    queryset = Agenda.objects.all()
    serializer_class = AgendaSerializer
    permission_classes = [IsAuthenticated, RequireActiveSubscription]

    def _resolve_office(self, request):
        office_id = request.headers.get('X-Office-Id') or request.query_params.get('office')
        if office_id:
            try:
                return Office.objects.get(pk=office_id)
            except Office.DoesNotExist:
                return None
        uor = UserOfficeRole.objects.filter(user=request.user, is_active=True).order_by('id').first()
        return uor.office if uor else None

    def get_queryset(self):
        office = self._resolve_office(self.request)
        qs = Agenda.objects.all()
        if office:
            qs = qs.filter(office=office)

        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(app_date__gte=parse_datetime(start))
        if end:
            qs = qs.filter(app_date__lte=parse_datetime(end))

        practitioners = self.request.query_params.get('practitioners')
        if practitioners:
            ids = [p for p in practitioners.split(',') if p]
            qs = qs.filter(practitioner_id__in=ids)

        return qs.order_by('app_date')

    def perform_create(self, serializer):
        office = self._resolve_office(self.request)
        if not office:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"office": "Impossible de déterminer le cabinet."})
        serializer.save(office=office)

    def perform_update(self, serializer):
        serializer.save()