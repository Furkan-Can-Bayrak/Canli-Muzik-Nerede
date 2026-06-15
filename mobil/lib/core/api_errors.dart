import 'dart:convert';

String formatApiErrorBody(dynamic body) {
  if (body == null) return 'İstek başarısız oldu.';
  if (body is String) {
    try {
      return formatApiErrorBody(jsonDecode(body));
    } catch (_) {
      return body.isNotEmpty ? body : 'İstek başarısız oldu.';
    }
  }
  if (body is Map<String, dynamic>) {
    final msg = body['message'];
    if (msg is String) return _localizeMessage(msg);
    if (msg is List) {
      return msg.whereType<String>().join(', ');
    }
  }
  return 'İstek başarısız oldu.';
}

String formatFetchError(Object error) {
  final msg = error.toString().toLowerCase();
  if (msg.contains('failed host lookup') ||
      msg.contains('connection refused') ||
      msg.contains('socketexception') ||
      msg.contains('network is unreachable')) {
    return 'Sunucuya bağlanılamadı. Backend\'in çalıştığından emin olun '
        '(Android emülatör: http://10.0.2.2:3000, fiziksel cihaz: bilgisayarın IP\'si).';
  }
  if (error is StateError && error.message.contains('API_BASE_URL')) {
    return 'API adresi tanımlı değil (API_BASE_URL).';
  }
  return error.toString().replaceFirst('Exception: ', '');
}

String _localizeMessage(String msg) {
  switch (msg) {
    case 'Invalid credentials':
      return 'E-posta veya şifre hatalı.';
    case 'Email already in use':
      return 'Bu e-posta adresi zaten kayıtlı.';
    default:
      return msg;
  }
}
