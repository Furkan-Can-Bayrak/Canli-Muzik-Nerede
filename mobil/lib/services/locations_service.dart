import '../core/api_client.dart';
import '../models/province.dart';

class LocationsService {
  LocationsService({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<List<Province>> listProvinces() async {
    final rows = await _api.getJsonList('/provinces');
    return rows.map(Province.fromJson).toList();
  }

  Future<List<District>> listDistricts(String provinceId) async {
    final rows = await _api.getJsonList('/provinces/$provinceId/districts');
    return rows.map(District.fromJson).toList();
  }

  void close() => _api.close();
}
