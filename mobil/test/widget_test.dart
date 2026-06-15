import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:canli_muzik_nerede/core/events_query.dart';
import 'package:canli_muzik_nerede/screens/login_screen.dart';
import 'package:canli_muzik_nerede/state/auth_controller.dart';

void main() {
  test('EventsFilters query string maps web params', () {
    const filters = EventsFilters(
      q: 'kadikoy',
      provinceId: 'prov-1',
      districtId: 'dist-1',
      bandId: 'band-1',
      minPrice: '100',
      maxPrice: '500',
      dateFrom: '2026-06-20',
      dateTo: '2026-06-21',
      take: 50,
    );

    final qs = filters.toQueryString();
    expect(qs, contains('q=kadikoy'));
    expect(qs, contains('provinceId=prov-1'));
    expect(qs, contains('districtId=dist-1'));
    expect(qs, contains('bandId=band-1'));
    expect(qs, contains('minPrice=100'));
    expect(qs, contains('maxPrice=500'));
    expect(qs, contains('startAtFrom='));
    expect(qs, contains('startAtTo='));
    expect(qs, contains('take=50'));
  });

  testWidgets('Giriş ekranı form alanlarını gösterir', (WidgetTester tester) async {
    final auth = AuthController()..ready = true;

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthController>.value(
        value: auth,
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Giriş yap'), findsOneWidget);
    expect(find.text('E-posta'), findsOneWidget);
    expect(find.text('Şifre'), findsOneWidget);
  });
}
