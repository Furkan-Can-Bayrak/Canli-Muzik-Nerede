class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    this.createdAt,
    this.displayName,
  });

  final String id;
  final String email;
  final String role;
  final DateTime? createdAt;
  final String? displayName;

  bool get isCustomer => role == 'CUSTOMER';

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final profile = json['customerProfile'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      displayName: profile?['displayName'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
      };
}
