import 'package:flutter_test/flutter_test.dart';

import 'package:canli_muzik_nerede/core/config.dart';
import 'package:canli_muzik_nerede/core/media_url.dart';

void main() {
  test('normalizeMediaUrl returns null for empty input', () {
    expect(normalizeMediaUrl(null), isNull);
    expect(normalizeMediaUrl(''), isNull);
    expect(normalizeMediaUrl('   '), isNull);
  });

  test('normalizeMediaUrl prefixes relative upload paths', () {
    expect(
      normalizeMediaUrl('/uploads/events/poster.jpg'),
      '${AppConfig.normalizedApiBaseUrl}/uploads/events/poster.jpg',
    );
  });

  test('normalizeMediaUrl rewrites localhost to API host', () {
    expect(
      normalizeMediaUrl('http://localhost:3000/uploads/events/poster.jpg'),
      '${AppConfig.normalizedApiBaseUrl}/uploads/events/poster.jpg',
    );
  });

  test('normalizeMediaUrl keeps external absolute URLs', () {
    const url = 'https://cdn.example.com/poster.jpg';
    expect(normalizeMediaUrl(url), url);
  });
}
