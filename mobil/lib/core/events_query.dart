class EventsFilters {
  const EventsFilters({
    this.q = '',
    this.provinceId = '',
    this.districtId = '',
    this.bandId = '',
    this.cafeId = '',
    this.minPrice = '',
    this.maxPrice = '',
    this.dateFrom = '',
    this.dateTo = '',
    this.take = 50,
  });

  final String q;
  final String provinceId;
  final String districtId;
  final String bandId;
  final String cafeId;
  final String minPrice;
  final String maxPrice;
  final String dateFrom;
  final String dateTo;
  final int take;

  EventsFilters copyWith({
    String? q,
    String? provinceId,
    String? districtId,
    String? bandId,
    String? cafeId,
    String? minPrice,
    String? maxPrice,
    String? dateFrom,
    String? dateTo,
    int? take,
  }) {
    return EventsFilters(
      q: q ?? this.q,
      provinceId: provinceId ?? this.provinceId,
      districtId: districtId ?? this.districtId,
      bandId: bandId ?? this.bandId,
      cafeId: cafeId ?? this.cafeId,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      dateFrom: dateFrom ?? this.dateFrom,
      dateTo: dateTo ?? this.dateTo,
      take: take ?? this.take,
    );
  }

  String toQueryString() {
    final params = <String, String>{};
    final query = q.trim();
    if (query.isNotEmpty) params['q'] = query;
    final cId = cafeId.trim();
    if (cId.isNotEmpty) params['cafeId'] = cId;
    if (provinceId.isNotEmpty) params['provinceId'] = provinceId;
    if (districtId.isNotEmpty) params['districtId'] = districtId;
    if (bandId.isNotEmpty) params['bandId'] = bandId;

    final minP = minPrice.trim();
    final maxP = maxPrice.trim();
    final minNum = int.tryParse(minP);
    final maxNum = int.tryParse(maxP);
    if (minNum != null) params['minPrice'] = '$minNum';
    if (maxNum != null) params['maxPrice'] = '$maxNum';

    if (dateFrom.isNotEmpty) {
      params['startAtFrom'] =
          DateTime.parse('${dateFrom}T00:00:00').toUtc().toIso8601String();
    }
    if (dateTo.isNotEmpty) {
      params['startAtTo'] =
          DateTime.parse('${dateTo}T23:59:59.999').toUtc().toIso8601String();
    }

    params['take'] = '$take';

    if (params.isEmpty) return '';
    return params.entries
        .map((e) => '${Uri.encodeQueryComponent(e.key)}='
            '${Uri.encodeQueryComponent(e.value)}')
        .join('&');
  }
}
