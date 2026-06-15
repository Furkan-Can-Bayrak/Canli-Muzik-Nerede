import '../core/media_url.dart';

class LocationRef {
  const LocationRef({required this.id, required this.name, this.plateCode});

  final String id;
  final String name;
  final String? plateCode;

  factory LocationRef.fromJson(Map<String, dynamic> json) {
    return LocationRef(
      id: json['id'] as String,
      name: json['name'] as String,
      plateCode: json['plateCode'] as String?,
    );
  }
}

class EventCafe {
  const EventCafe({
    required this.userId,
    required this.name,
    required this.address,
    this.description,
    this.phone,
    this.province,
    this.district,
  });

  final String userId;
  final String name;
  final String address;
  final String? description;
  final String? phone;
  final LocationRef? province;
  final LocationRef? district;

  factory EventCafe.fromJson(Map<String, dynamic> json) {
    return EventCafe(
      userId: json['userId'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      description: json['description'] as String?,
      phone: json['phone'] as String?,
      province: json['province'] != null
          ? LocationRef.fromJson(json['province'] as Map<String, dynamic>)
          : null,
      district: json['district'] != null
          ? LocationRef.fromJson(json['district'] as Map<String, dynamic>)
          : null,
    );
  }
}

class EventBand {
  const EventBand({
    required this.userId,
    required this.bandName,
    this.memberCount,
    this.description,
  });

  final String userId;
  final String bandName;
  final int? memberCount;
  final String? description;

  factory EventBand.fromJson(Map<String, dynamic> json) {
    return EventBand(
      userId: json['userId'] as String,
      bandName: json['bandName'] as String,
      memberCount: json['memberCount'] as int?,
      description: json['description'] as String?,
    );
  }
}

class Event {
  const Event({
    required this.id,
    required this.address,
    this.title,
    this.description,
    this.startAt,
    this.endAt,
    this.price,
    this.posterUrl,
    required this.provinceId,
    this.districtId,
    this.province,
    this.district,
    required this.cafe,
    this.band,
  });

  final String id;
  final String? title;
  final String address;
  final String? description;
  final DateTime? startAt;
  final DateTime? endAt;
  final int? price;
  final String? posterUrl;
  final String provinceId;
  final String? districtId;
  final LocationRef? province;
  final LocationRef? district;
  final EventCafe cafe;
  final EventBand? band;

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      title: json['title'] as String?,
      address: json['address'] as String,
      description: json['description'] as String?,
      startAt: json['startAt'] != null
          ? DateTime.tryParse(json['startAt'] as String)
          : null,
      endAt:
          json['endAt'] != null ? DateTime.tryParse(json['endAt'] as String) : null,
      price: json['price'] as int?,
      posterUrl: normalizeMediaUrl(json['posterUrl'] as String?),
      provinceId: json['provinceId'] as String,
      districtId: json['districtId'] as String?,
      province: json['province'] != null
          ? LocationRef.fromJson(json['province'] as Map<String, dynamic>)
          : null,
      district: json['district'] != null
          ? LocationRef.fromJson(json['district'] as Map<String, dynamic>)
          : null,
      cafe: EventCafe.fromJson(json['cafe'] as Map<String, dynamic>),
      band: json['band'] != null
          ? EventBand.fromJson(json['band'] as Map<String, dynamic>)
          : null,
    );
  }
}
