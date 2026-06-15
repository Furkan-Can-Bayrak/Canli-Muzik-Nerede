import 'config.dart';

/// Relative upload paths and localhost URLs are rewritten for the mobile API host.
String? normalizeMediaUrl(String? url) {
  if (url == null) return null;
  final trimmed = url.trim();
  if (trimmed.isEmpty) return null;

  final base = AppConfig.normalizedApiBaseUrl;
  if (base.isEmpty) return trimmed;

  final baseUri = Uri.parse(base);

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    final parsed = Uri.tryParse(trimmed);
    if (parsed == null) return trimmed;
    if (parsed.host == 'localhost' || parsed.host == '127.0.0.1') {
      final query = parsed.hasQuery ? '?${parsed.query}' : '';
      return '${baseUri.origin}${parsed.path}$query';
    }
    return trimmed;
  }

  return '$base${trimmed.startsWith('/') ? trimmed : '/$trimmed'}';
}
