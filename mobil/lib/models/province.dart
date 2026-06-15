class Province {
  const Province({
    required this.id,
    required this.name,
    this.plateCode,
  });

  final String id;
  final String name;
  final String? plateCode;

  factory Province.fromJson(Map<String, dynamic> json) {
    return Province(
      id: json['id'] as String,
      name: json['name'] as String,
      plateCode: json['plateCode'] as String?,
    );
  }
}

class District {
  const District({
    required this.id,
    required this.name,
    required this.provinceId,
  });

  final String id;
  final String name;
  final String provinceId;

  factory District.fromJson(Map<String, dynamic> json) {
    return District(
      id: json['id'] as String,
      name: json['name'] as String,
      provinceId: json['provinceId'] as String,
    );
  }
}

class ReverseGeocodeResult {
  const ReverseGeocodeResult({
    this.provinceId,
    this.districtId,
  });

  final String? provinceId;
  final String? districtId;

  factory ReverseGeocodeResult.fromJson(Map<String, dynamic> json) {
    return ReverseGeocodeResult(
      provinceId: json['provinceId'] as String?,
      districtId: json['districtId'] as String?,
    );
  }
}
