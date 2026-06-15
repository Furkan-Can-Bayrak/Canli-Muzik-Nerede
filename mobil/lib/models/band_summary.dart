class BandSummary {
  const BandSummary({required this.id, required this.bandName});

  final String id;
  final String bandName;

  factory BandSummary.fromJson(Map<String, dynamic> json) {
    return BandSummary(
      id: (json['id'] ?? json['userId']) as String,
      bandName: json['bandName'] as String,
    );
  }
}
