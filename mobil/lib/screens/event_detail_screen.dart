import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_colors.dart';
import '../core/formatters.dart';
import '../models/event.dart';
import '../services/events_service.dart';
import '../state/auth_controller.dart';
import '../widgets/app_decor.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.eventId});

  final String eventId;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final EventsService _service = EventsService();
  Event? _event;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _service.close();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthController>();
    if (!auth.ready) return;

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final event = await _service.getEvent(
        widget.eventId,
        token: auth.token,
      );
      if (!mounted) return;
      setState(() => _event = event);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ev = _event;
    final location = ev == null
        ? ''
        : formatLocationLabel(
            provinceName: ev.province?.name,
            districtName: ev.district?.name,
          );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Etkinlik'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: AmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _ErrorBody(
                    message: _error!,
                    onBack: () => Navigator.pop(context),
                  )
                : ev == null
                    ? const SizedBox.shrink()
                    : SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            OutlinedButton.icon(
                              onPressed: () => Navigator.of(context).pop(),
                              icon: const Icon(Icons.arrow_back, size: 18),
                              label: const Text('Tüm etkinlikler'),
                            ),
                            const SizedBox(height: 16),
                            _Poster(posterUrl: ev.posterUrl),
                            const SizedBox(height: 16),
                            GlassCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SectionLabel('Etkinlik'),
                                  const SizedBox(height: 8),
                                  Text(
                                    eventDisplayTitle(ev.title),
                                    style:
                                        Theme.of(context).textTheme.headlineMedium,
                                  ),
                                  if (location.isNotEmpty) ...[
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.location_on_outlined,
                                          size: 18,
                                          color: AppColors.onSurfaceVariant,
                                        ),
                                        const SizedBox(width: 6),
                                        Expanded(child: Text(location)),
                                      ],
                                    ),
                                  ],
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _InfoTile(
                                          label: 'Tarih',
                                          value: formatEventWhen(ev.startAt),
                                          icon: Icons.calendar_today_outlined,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _InfoTile(
                                          label: 'Liste fiyatı',
                                          value: formatEventPrice(ev.price),
                                          icon: Icons.payments_outlined,
                                          subtitle:
                                              'İşletmenin duyurduğu giriş ücreti',
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (ev.endAt != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      'Bitiş: ${formatEventWhen(ev.endAt)}',
                                      style:
                                          Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            if (ev.description != null &&
                                ev.description!.trim().isNotEmpty) ...[
                              const SizedBox(height: 16),
                              GlassCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SectionLabel('Açıklama'),
                                    const SizedBox(height: 10),
                                    Text(
                                      ev.description!,
                                      style:
                                          Theme.of(context).textTheme.bodyLarge,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 16),
                            GlassCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SectionLabel('Mekân'),
                                  const SizedBox(height: 12),
                                  _EntityBlock(
                                    icon: Icons.storefront_outlined,
                                    accent: AppColors.secondary,
                                    title: ev.cafe.name,
                                    lines: [
                                      ev.address,
                                      if (ev.cafe.description != null &&
                                          ev.cafe.description!.trim().isNotEmpty)
                                        ev.cafe.description!,
                                      if (ev.cafe.phone != null)
                                        'Telefon: ${ev.cafe.phone}'
                                      else
                                        'İşletme telefonu yalnızca yetkili kullanıcılara gösterilir.',
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (ev.band != null) ...[
                              const SizedBox(height: 16),
                              GlassCard(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SectionLabel('Sahne alan grup'),
                                    const SizedBox(height: 12),
                                    _EntityBlock(
                                      icon: Icons.music_note_outlined,
                                      accent: AppColors.primary,
                                      title: ev.band!.bandName,
                                      lines: [
                                        if (ev.band!.memberCount != null)
                                          '${ev.band!.memberCount} üye',
                                        if (ev.band!.description != null &&
                                            ev.band!.description!
                                                .trim()
                                                .isNotEmpty)
                                          ev.band!.description!,
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  const _Poster({this.posterUrl});

  final String? posterUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: AspectRatio(
        aspectRatio: 21 / 9,
        child: Stack(
          fit: StackFit.expand,
          children: [
            posterUrl != null && posterUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: posterUrl!,
                    fit: BoxFit.cover,
                    errorWidget: (context, url, error) =>
                        const _PosterFallback(),
                  )
                : const _PosterFallback(),
            Positioned(
              top: 14,
              right: 14,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'CANLI',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppColors.onPrimary,
                        letterSpacing: 0.5,
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PosterFallback extends StatelessWidget {
  const _PosterFallback();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0x59D0BCFF),
            AppColors.surfaceContainerHigh,
            Color(0x4089CEFF),
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.music_note_outlined,
          size: 64,
          color: AppColors.primary.withValues(alpha: 0.8),
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.label,
    required this.value,
    required this.icon,
    this.subtitle,
  });

  final String label;
  final String value;
  final IconData icon;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionLabel(label, color: AppColors.onSurfaceVariant),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.onSurface,
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}

class _EntityBlock extends StatelessWidget {
  const _EntityBlock({
    required this.icon,
    required this.accent,
    required this.title,
    required this.lines,
  });

  final IconData icon;
  final Color accent;
  final String title;
  final List<String> lines;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: accent.withValues(alpha: 0.15),
            border: Border.all(color: accent.withValues(alpha: 0.3)),
          ),
          child: Icon(icon, color: accent),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              for (final line in lines) ...[
                const SizedBox(height: 6),
                Text(line, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.message, required this.onBack});

  final String message;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.errorContainer.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.error.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              message,
              style: TextStyle(color: AppColors.error),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(onPressed: onBack, child: const Text('Etkinlik listesine dön')),
        ],
      ),
    );
  }
}
