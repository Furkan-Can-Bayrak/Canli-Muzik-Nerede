import 'package:flutter_test/flutter_test.dart';

import 'package:canli_muzik_nerede/core/events_query.dart';

void main() {
  test('empty optional filters are omitted', () {
    const filters = EventsFilters();
    final qs = filters.toQueryString();
    expect(qs, 'take=50');
  });

  test('cafeId is trimmed before sending', () {
    const filters = EventsFilters(cafeId: '  cafe-uuid  ');
    final qs = filters.toQueryString();
    expect(qs, contains('cafeId=cafe-uuid'));
  });
}
