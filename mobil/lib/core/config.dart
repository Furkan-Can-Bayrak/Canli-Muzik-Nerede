/// Derleme zamanı `--dart-define=API_BASE_URL=...` ile geçilir.
///
/// Yerel geliştirme: Flutter web istemcisinde olduğu gibi sonunda `/` olmaz.
/// Android emülatörde makine `localhost` → genelde `http://10.0.2.2:3000`
class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static String get normalizedApiBaseUrl {
    final t = apiBaseUrl.trim();
    if (t.isEmpty) {
      return '';
    }
    return t.endsWith('/') ? t.substring(0, t.length - 1) : t;
  }

  /// Arayüzde göstermek için (debug / README ile uyumlu).
  static bool get hasApiBaseUrl => normalizedApiBaseUrl.isNotEmpty;
}
