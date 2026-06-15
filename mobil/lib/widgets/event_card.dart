import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/app_colors.dart';
import '../core/event_timing.dart';
import '../core/formatters.dart';
import '../models/event.dart';

class EventCard extends StatelessWidget {
  const EventCard({super.key, required this.event, required this.onTap});

  final Event event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final past = isPastEventModel(event);
    final venueLine = [
      event.cafe.name,
      if (event.band != null) event.band!.bandName,
    ].join(' · ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Opacity(
        opacity: past ? 0.78 : 1,
        child: Material(
          color: past
              ? AppColors.surfaceContainerLow
              : AppColors.surfaceContainer,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: past
                      ? AppColors.outlineVariant.withValues(alpha: 0.35)
                      : AppColors.outlineVariant.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: 156,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(14),
                          ),
                          child: past
                              ? ColorFiltered(
                                  colorFilter: const ColorFilter.matrix([
                                    0.45, 0.35, 0.2, 0, 0,
                                    0.45, 0.35, 0.2, 0, 0,
                                    0.45, 0.35, 0.2, 0, 0,
                                    0, 0, 0, 1, 0,
                                  ]),
                                  child: _PosterImage(event: event),
                                )
                              : _PosterImage(event: event),
                        ),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: past
                                  ? AppColors.surfaceContainerHigh
                                  : AppColors.primary,
                              borderRadius: BorderRadius.circular(4),
                              border: past
                                  ? Border.all(
                                      color: AppColors.outlineVariant
                                          .withValues(alpha: 0.5),
                                    )
                                  : null,
                            ),
                            child: Text(
                              past ? 'GEÇMİŞ' : 'CANLI',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: past
                                    ? AppColors.onSurfaceVariant
                                    : AppColors.onPrimary,
                                letterSpacing: 0.4,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              size: 14,
                              color: past
                                  ? AppColors.onSurfaceVariant
                                  : AppColors.primary,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                formatWhenShort(event.startAt),
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: past
                                      ? AppColors.onSurfaceVariant
                                      : AppColors.primary,
                                  fontSize: 12,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          eventDisplayTitle(event.title),
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: past
                                ? AppColors.onSurfaceVariant
                                : AppColors.onSurface,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          venueLine,
                          style: theme.textTheme.bodySmall,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text(
                              event.price != null
                                  ? formatEventPrice(event.price)
                                  : 'Ücret —',
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: past
                                    ? AppColors.onSurfaceVariant
                                    : AppColors.onSurface,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              'Detay →',
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: past
                                    ? AppColors.onSurfaceVariant
                                    : AppColors.secondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PosterImage extends StatelessWidget {
  const _PosterImage({required this.event});

  final Event event;

  @override
  Widget build(BuildContext context) {
    if (event.posterUrl != null && event.posterUrl!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: event.posterUrl!,
        fit: BoxFit.cover,
        height: 156,
        width: double.infinity,
        errorWidget: (context, url, error) =>
            _PosterFallback(past: isPastEventModel(event)),
      );
    }
    return _PosterFallback(past: isPastEventModel(event));
  }
}

class _PosterFallback extends StatelessWidget {
  const _PosterFallback({this.past = false});

  final bool past;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(past ? 0x33D0BCFF : 0x59D0BCFF),
            AppColors.surfaceContainerHigh,
            Color(past ? 0x2089CEFF : 0x4089CEFF),
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.music_note_outlined,
          size: 40,
          color: AppColors.primary.withValues(alpha: past ? 0.5 : 0.8),
        ),
      ),
    );
  }
}
