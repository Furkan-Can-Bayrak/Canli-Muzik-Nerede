import 'package:http/http.dart' as http;

import 'config.dart';

class ApiClient {
  ApiClient({
    http.Client? httpClient,
    String? baseUrl,
  })  : _http = httpClient ?? http.Client(),
        _baseUrl = baseUrl ?? AppConfig.normalizedApiBaseUrl;

  final http.Client _http;
  final String _baseUrl;

  Uri joinUri(String path) {
    final base = _baseUrl.trim();
    if (base.isEmpty) {
      throw StateError('API_BASE_URL tanımlı değil');
    }
    final normalized =
        base.endsWith('/') ? base.substring(0, base.length - 1) : base;
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalized$p');
  }

  Future<http.Response> get(
    String path, {
    String? token,
    Map<String, String>? headers,
  }) async {
    final h = {...?headers};
    final t = token;
    if (t != null && t.isNotEmpty) {
      h['Authorization'] = 'Bearer $t';
    }
    return _http.get(joinUri(path), headers: h);
  }

  void close() => _http.close();
}
