import 'package:flutter/material.dart';

import '../content/app_copy.dart';
import '../core/api_client.dart';
import '../core/config.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

enum _BackendStatus {
  idle,
  loading,
  ok,
  error,
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _api = ApiClient();
  _BackendStatus _status = _BackendStatus.idle;
  int? _httpStatus;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkBackend();
  }

  Future<void> _checkBackend() async {
    if (!AppConfig.hasApiBaseUrl) {
      setState(() {
        _status = _BackendStatus.error;
        _errorMessage = 'API_BASE_URL boş.';
      });
      return;
    }

    setState(() {
      _status = _BackendStatus.loading;
      _httpStatus = null;
      _errorMessage = null;
    });

    try {
      final response = await _api.get('/auth/me');
      if (!mounted) {
        return;
      }
      setState(() {
        _status = _BackendStatus.ok;
        _httpStatus = response.statusCode;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }
      setState(() {
        _status = _BackendStatus.error;
        _errorMessage = e.toString();
      });
    }
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Canlı Müzik Nerede')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _HeroCard(
              titleStyle: textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.5,
              ),
              subtitleStyle: textTheme.bodyMedium?.copyWith(
                color: const Color(0xFFD4D4D8),
                height: 1.45,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Projemiz',
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            ..._buildVisionParagraphs(textTheme),
            const SizedBox(height: 20),
            Card(
              clipBehavior: Clip.antiAlias,
              child: ExpansionTile(
                initiallyExpanded: false,
                title: const Text('Geliştirici: bağlantı durumu'),
                subtitle: const Text(
                  'API tabanı ve GET /auth/me ile backend doğrulaması',
                  style: TextStyle(fontSize: 12),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                children: [
                  Text(
                    'API tabanı (--dart-define ile değişir):',
                    style: textTheme.titleSmall,
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    AppConfig.hasApiBaseUrl
                        ? AppConfig.normalizedApiBaseUrl
                        : '(tanımsız)',
                    style: textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'GET /auth/me (token olmadan) ile backend doğrulanır:',
                    style: textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  _buildStatus(context),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: _status == _BackendStatus.loading
                        ? null
                        : _checkBackend,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Tekrar dene'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildVisionParagraphs(TextTheme textTheme) {
    final widgets = <Widget>[];
    for (var i = 0; i < AppCopy.visionBodyParagraphs.length; i++) {
      if (i > 0) {
        widgets.add(const SizedBox(height: 14));
      }
      widgets.add(
        SelectableText(
          AppCopy.visionBodyParagraphs[i],
          style: textTheme.bodyLarge?.copyWith(height: 1.5),
        ),
      );
    }
    return widgets;
  }

  Widget _buildStatus(BuildContext context) {
    switch (_status) {
      case _BackendStatus.idle:
        return Text(
          'Henüz denenmedi.',
          style: Theme.of(context).textTheme.bodyMedium,
        );
      case _BackendStatus.loading:
        return const Row(
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Expanded(child: Text('Backend bağlantısı kontrol ediliyor…')),
          ],
        );
      case _BackendStatus.error:
        final msg = _errorMessage ?? '';
        return Text.rich(
          TextSpan(
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.error),
            children: [
              const TextSpan(text: 'İstek başarısız: '),
              TextSpan(text: msg),
              TextSpan(
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.error,
                    ),
                text:
                    '\n\nAndroid emülatör için tabanı http://10.0.2.2:3000 yapın; '
                    'fiziksel cihazda bilgisayarın LAN IP adresini kullanın.',
              ),
            ],
          ),
        );
      case _BackendStatus.ok:
        final code = _httpStatus!;
        final expected = code == 401 || code == 403;
        return Text.rich(
          TextSpan(
            style: Theme.of(context).textTheme.bodyMedium,
            children: [
              const TextSpan(
                text: 'GET ',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              TextSpan(text: '/auth/me yanıt: '),
              TextSpan(
                text: '$code',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
              TextSpan(
                text: expected
                    ? ' — giriş yapılmadığı için beklenen bir durum.'
                    : ' — beklenmedik kod; Swagger veya backend loglarını kontrol edin.',
              ),
              TextSpan(
                style: Theme.of(context).textTheme.bodySmall,
                text: '\n(Native mobilde tarayıcı CORS kuralı uygulanmaz.)',
              ),
            ],
          ),
        );
    }
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.titleStyle,
    required this.subtitleStyle,
  });

  final TextStyle? titleStyle;
  final TextStyle? subtitleStyle;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF18181B),
            Color(0xFF3F3F46),
          ],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(AppCopy.heroTitle, style: titleStyle),
            const SizedBox(height: 12),
            Text(AppCopy.heroSubtitle, style: subtitleStyle),
          ],
        ),
      ),
    );
  }
}
