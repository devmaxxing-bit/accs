import json

from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Note


@require_GET
def users_list(request):
    users = User.objects.order_by('id').values('id', 'username', 'email')
    return JsonResponse(list(users), safe=False)


@csrf_exempt
@require_POST
def create_note(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Некорректный JSON'}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({'error': 'Ожидается JSON-объект'}, status=400)

    user_id = data.get('user_id')
    text = data.get('text')
    if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id <= 0:
        return JsonResponse({'error': 'Поле user_id должно быть положительным числом'}, status=400)
    if not isinstance(text, str) or not text.strip():
        return JsonResponse({'error': 'Поле text не должно быть пустым'}, status=400)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден'}, status=404)

    note = Note.objects.create(user=user, text=text)
    return JsonResponse({
        'message': 'Заметка создана',
        'user_id': user.id,
        'text': note.text,
    }, status=201)
