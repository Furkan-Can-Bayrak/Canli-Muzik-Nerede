import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_errors.dart';
import 'config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

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

  Map<String, String> _headers({String? token, bool jsonBody = false}) {
    final h = <String, String>{};
    if (jsonBody) h['Content-Type'] = 'application/json';
    final t = token;
    if (t != null && t.isNotEmpty) {
      h['Authorization'] = 'Bearer $t';
    }
    return h;
  }

  Future<http.Response> get(
    String path, {
    String? token,
    Map<String, String>? headers,
  }) async {
    try {
      final h = {..._headers(token: token), ...?headers};
      return await _http.get(joinUri(path), headers: h);
    } catch (e) {
      throw ApiException(formatFetchError(e));
    }
  }

  Future<http.Response> post(
    String path, {
    Object? body,
    String? token,
    Map<String, String>? headers,
  }) async {
    try {
      final h = {..._headers(token: token, jsonBody: true), ...?headers};
      return await _http.post(
        joinUri(path),
        headers: h,
        body: body == null ? null : jsonEncode(body),
      );
    } catch (e) {
      throw ApiException(formatFetchError(e));
    }
  }

  Future<http.Response> delete(
    String path, {
    String? token,
    Map<String, String>? headers,
  }) async {
    try {
      final h = {..._headers(token: token), ...?headers};
      return await _http.delete(joinUri(path), headers: h);
    } catch (e) {
      throw ApiException(formatFetchError(e));
    }
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    String? token,
    int okStatus = 200,
  }) async {
    final res = await get(path, token: token);
    return _decodeResponse(res, okStatus: okStatus);
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? body,
    String? token,
    int okStatus = 200,
  }) async {
    final res = await post(path, body: body, token: token);
    return _decodeResponse(res, okStatus: okStatus);
  }

  Future<Map<String, dynamic>> _decodeResponse(
    http.Response res, {
    required int okStatus,
  }) async {
    if (res.statusCode == okStatus || res.statusCode == 201) {
      if (res.body.isEmpty) return {};
      final decoded = jsonDecode(res.body);
      if (decoded is Map<String, dynamic>) return decoded;
      throw ApiException('Beklenmeyen yanıt biçimi.', statusCode: res.statusCode);
    }
    throw ApiException(
      formatApiErrorBody(
        res.body.isNotEmpty ? jsonDecode(res.body) : null,
      ),
      statusCode: res.statusCode,
    );
  }

  Future<List<Map<String, dynamic>>> getJsonList(
    String path, {
    String? token,
  }) async {
    final res = await get(path, token: token);
    if (!res.statusCode.toString().startsWith('2')) {
      dynamic body;
      try {
        body = res.body.isNotEmpty ? jsonDecode(res.body) : null;
      } catch (_) {
        body = res.body;
      }
      throw ApiException(formatApiErrorBody(body), statusCode: res.statusCode);
    }
    final decoded = jsonDecode(res.body);
    if (decoded is! List) {
      throw ApiException('Beklenmeyen yanıt biçimi.', statusCode: res.statusCode);
    }
    return decoded.cast<Map<String, dynamic>>();
  }

  void close() => _http.close();
}
