import 'package:flutter_test/flutter_test.dart';

import 'package:canli_muzik_nerede/main.dart';

void main() {
  testWidgets('Ana ekran uygulaması yüklenir', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    expect(find.text('Canlı Müzik Nerede'), findsOneWidget);
    expect(find.text('Canlı müziği keşfedin'), findsOneWidget);
  });
}
