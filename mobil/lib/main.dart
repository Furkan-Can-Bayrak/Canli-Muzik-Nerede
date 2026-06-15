import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/app_theme.dart';
import 'screens/account_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/events_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'state/auth_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('tr_TR');
  final auth = AuthController();
  await auth.bootstrap();
  runApp(CanliMuzikApp(auth: auth));
}

class CanliMuzikApp extends StatelessWidget {
  const CanliMuzikApp({super.key, required this.auth});

  final AuthController auth;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: auth,
      child: MaterialApp(
        title: 'Canlı Müzik Nerede',
        locale: const Locale('tr', 'TR'),
        supportedLocales: const [Locale('tr', 'TR')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        theme: AppTheme.build(),
        initialRoute: '/',
        onGenerateRoute: (settings) {
          if (settings.name?.startsWith('/events/') == true) {
            final id = settings.name!.substring('/events/'.length);
            if (id.isNotEmpty) {
              return MaterialPageRoute<void>(
                builder: (_) => EventDetailScreen(eventId: id),
                settings: settings,
              );
            }
          }
          switch (settings.name) {
            case '/':
              return MaterialPageRoute<void>(
                builder: (_) => const EventsScreen(),
                settings: settings,
              );
            case '/login':
              return MaterialPageRoute<void>(
                builder: (_) => const LoginScreen(),
                settings: settings,
              );
            case '/register':
              return MaterialPageRoute<void>(
                builder: (_) => const RegisterScreen(),
                settings: settings,
              );
            case '/account':
              return MaterialPageRoute<void>(
                builder: (_) => const AccountScreen(),
                settings: settings,
              );
            default:
              return MaterialPageRoute<void>(
                builder: (_) => const EventsScreen(),
                settings: settings,
              );
          }
        },
      ),
    );
  }
}
