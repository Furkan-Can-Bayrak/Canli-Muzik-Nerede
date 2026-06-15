import 'package:flutter/foundation.dart';

import '../models/auth_user.dart';
import '../services/auth_service.dart';

class AuthController extends ChangeNotifier {
  AuthController({AuthService? service}) : _service = service ?? AuthService();

  final AuthService _service;

  bool ready = false;
  String? token;
  AuthUser? user;

  bool get isLoggedIn => token != null && user != null;

  Future<void> bootstrap() async {
    try {
      final stored = await _service.readStoredAuth();
      if (stored != null) {
        final me = await _service.validateSession(stored.accessToken);
        if (!me.isCustomer) {
          await _service.logout();
        } else {
          token = stored.accessToken;
          user = me;
        }
      }
    } catch (_) {
      await _service.logout();
      token = null;
      user = null;
    } finally {
      ready = true;
      notifyListeners();
    }
  }

  Future<AuthUser> login(String email, String password) async {
    final auth = await _service.login(email, password);
    token = auth.accessToken;
    user = auth.user;
    notifyListeners();
    return auth.user;
  }

  Future<AuthUser> registerCustomer({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final auth = await _service.registerCustomer(
      email: email,
      password: password,
      displayName: displayName,
    );
    token = auth.accessToken;
    user = auth.user;
    notifyListeners();
    return auth.user;
  }

  Future<void> refreshProfile() async {
    final t = token;
    if (t == null) return;
    user = await _service.validateSession(t);
    notifyListeners();
  }

  Future<void> logout() async {
    await _service.logout();
    token = null;
    user = null;
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    final t = token;
    if (t == null) return;
    await _service.deleteAccount(t);
    token = null;
    user = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _service.close();
    super.dispose();
  }
}
