import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// API tabanı: `--dart-define=API_BASE_URL=...` ile geçilebilir.
///
/// Android emülatörde `localhost` emülatörün kendisidir; bilgisayardaki backend
/// için varsayılan `http://10.0.2.2:3000` kullanılır.
class AppConfig {
  AppConfig._();

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.trim().isNotEmpty) return fromEnv.trim();

    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static String get normalizedApiBaseUrl {
    final t = apiBaseUrl.trim();
    if (t.isEmpty) {
      return '';
    }
    return t.endsWith('/') ? t.substring(0, t.length - 1) : t;
  }

  static bool get hasApiBaseUrl => normalizedApiBaseUrl.isNotEmpty;
}
