import 'package:intl/intl.dart';

String formatWhenShort(DateTime? date) {
  if (date == null) return '—';
  return _trDateShort.format(date.toLocal());
}

final _trDate = DateFormat('d MMMM yyyy, HH:mm', 'tr_TR');
final _trDateShort = DateFormat('d MMMM yyyy', 'tr_TR');
final _trPrice = NumberFormat.decimalPattern('tr_TR');

String formatEventWhen(DateTime? date) {
  if (date == null) return 'Tarih henüz belirtilmedi';
  return _trDate.format(date.toLocal());
}

String formatEventPrice(int? price) {
  if (price == null) return '—';
  return '${_trPrice.format(price)} ₺';
}

String formatLocationLabel({
  String? provinceName,
  String? districtName,
}) {
  return [provinceName, districtName].where((s) => s != null && s.isNotEmpty).join(' · ');
}

String eventDisplayTitle(String? title) {
  final t = title?.trim();
  if (t == null || t.isEmpty) return 'Canlı müzik gecesi';
  return t;
}
