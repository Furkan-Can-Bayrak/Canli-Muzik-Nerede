import 'dart:convert';

import '../core/api_client.dart';
import '../core/api_errors.dart';
import '../core/auth_storage.dart';
import '../models/auth_user.dart';

class AuthService {
  AuthService({ApiClient? api, AuthStorage? storage})
      : _api = api ?? ApiClient(),
        _storage = storage ?? AuthStorage();

  final ApiClient _api;
  final AuthStorage _storage;

  AuthStorage get storage => _storage;

  Future<StoredAuth?> readStoredAuth() => _storage.read();

  Future<AuthUser> validateSession(String token) async {
    final data = await _api.getJson('/auth/me', token: token);
    return AuthUser.fromJson(data);
  }

  Future<StoredAuth> login(String email, String password) async {
    final data = await _api.postJson(
      '/auth/login',
      body: {'email': email.trim(), 'password': password},
    );
    final auth = StoredAuth(
      accessToken: data['accessToken'] as String,
      user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
    );
    _ensureCustomer(auth.user);
    await _storage.write(auth);
    return auth;
  }

  Future<StoredAuth> registerCustomer({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final body = <String, dynamic>{
      'email': email.trim(),
      'password': password,
    };
    final name = displayName?.trim();
    if (name != null && name.isNotEmpty) body['displayName'] = name;

    final data = await _api.postJson('/auth/register/customer', body: body);
    final auth = StoredAuth(
      accessToken: data['accessToken'] as String,
      user: AuthUser.fromJson(data['user'] as Map<String, dynamic>),
    );
    _ensureCustomer(auth.user);
    await _storage.write(auth);
    return auth;
  }

  Future<void> logout() => _storage.clear();

  Future<void> deleteAccount(String token) async {
    final res = await _api.delete('/auth/me', token: token);
    if (res.statusCode != 200) {
      dynamic body;
      try {
        body = res.body.isNotEmpty ? jsonDecode(res.body) : null;
      } catch (_) {
        body = res.body;
      }
      throw ApiException(formatApiErrorBody(body), statusCode: res.statusCode);
    }
    await _storage.clear();
  }

  void _ensureCustomer(AuthUser user) {
    if (!user.isCustomer) {
      throw ApiException('Bu uygulama yalnızca müşteriler içindir.');
    }
  }

  void close() => _api.close();
}
