import 'package:flutter_test/flutter_test.dart';

import 'package:canli_muzik_nerede/core/event_timing.dart';
import 'package:canli_muzik_nerede/models/event.dart';

Event _event(DateTime? startAt) {
  return Event(
    id: 'e1',
    address: 'addr',
    provinceId: 'p1',
    cafe: EventCafe(
      userId: 'c1',
      name: 'Cafe',
      address: 'addr',
    ),
    startAt: startAt,
  );
}

void main() {
  test('past events sort after upcoming', () {
    final future = DateTime.now().add(const Duration(days: 2));
    final past = DateTime.now().subtract(const Duration(days: 2));

    final sorted = sortEventsForDisplay([
      _event(past),
      _event(future),
    ]);

    expect(sorted.first.startAt, future);
    expect(sorted.last.startAt, past);
  });
}
