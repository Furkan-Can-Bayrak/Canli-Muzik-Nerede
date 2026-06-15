import '../core/api_client.dart';
import '../core/events_query.dart';
import '../models/band_summary.dart';
import '../models/event.dart';

class EventsService {
  EventsService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<List<Event>> listEvents({
    required EventsFilters filters,
    String? token,
  }) async {
    final qs = filters.toQueryString();
    final path = qs.isEmpty ? '/events' : '/events?$qs';
    final rows = await _api.getJsonList(path, token: token);
    return rows.map(Event.fromJson).toList();
  }

  Future<Event> getEvent(String id, {String? token}) async {
    try {
      final data = await _api.getJson('/events/$id', token: token);
      return Event.fromJson(data);
    } on ApiException catch (e) {
      if (e.statusCode == 404) {
        throw ApiException('Etkinlik bulunamadı.', statusCode: 404);
      }
      rethrow;
    }
  }

  Future<List<BandSummary>> listBands({
    String? provinceId,
    String? districtId,
  }) async {
    final params = <String, String>{};
    if (districtId != null && districtId.isNotEmpty) {
      params['districtId'] = districtId;
    } else if (provinceId != null && provinceId.isNotEmpty) {
      params['provinceId'] = provinceId;
    }
    final qs = params.entries
        .map((e) =>
            '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}')
        .join('&');
    final path = qs.isEmpty ? '/bands' : '/bands?$qs';
    final rows = await _api.getJsonList(path);
    return rows.map(BandSummary.fromJson).toList();
  }

  void close() => _api.close();
}
