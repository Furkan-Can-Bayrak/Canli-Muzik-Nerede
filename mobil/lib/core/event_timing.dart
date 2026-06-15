import '../models/event.dart';

bool isPastEvent({DateTime? startAt, DateTime? endAt}) {
  final now = DateTime.now();
  if (endAt != null) {
    return endAt.isBefore(now);
  }
  if (startAt != null) {
    final dayEnd = DateTime(
      startAt.year,
      startAt.month,
      startAt.day,
      23,
      59,
      59,
      999,
    );
    return dayEnd.isBefore(now);
  }
  return false;
}

bool isPastEventModel(Event event) =>
    isPastEvent(startAt: event.startAt, endAt: event.endAt);

/// Yaklaşanlar önce, günü geçmişler sonda.
List<Event> sortEventsForDisplay(List<Event> events) {
  final copy = [...events];
  copy.sort((a, b) {
    final aPast = isPastEventModel(a);
    final bPast = isPastEventModel(b);
    if (aPast != bPast) return aPast ? 1 : -1;

    final aTs = a.startAt?.millisecondsSinceEpoch ?? 1 << 62;
    final bTs = b.startAt?.millisecondsSinceEpoch ?? 1 << 62;
    return aPast ? bTs.compareTo(aTs) : aTs.compareTo(bTs);
  });
  return copy;
}
