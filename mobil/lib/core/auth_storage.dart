import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth_user.dart';

const _storageKey = 'canli_muzik_auth';

class StoredAuth {
  const StoredAuth({required this.accessToken, required this.user});

  final String accessToken;
  final AuthUser user;

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'user': user.toJson(),
      };

  factory StoredAuth.fromJson(Map<String, dynamic> json) {
    return StoredAuth(
      accessToken: json['accessToken'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class AuthStorage {
  AuthStorage({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  Future<StoredAuth?> read() async {
    final raw = await _storage.read(key: _storageKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      final auth = StoredAuth.fromJson(data);
      if (auth.accessToken.isEmpty || auth.user.id.isEmpty) return null;
      return auth;
    } catch (_) {
      return null;
    }
  }

  Future<void> write(StoredAuth auth) async {
    await _storage.write(key: _storageKey, value: jsonEncode(auth.toJson()));
  }

  Future<void> clear() async {
    await _storage.delete(key: _storageKey);
  }
}
