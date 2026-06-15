import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_colors.dart';
import '../core/event_timing.dart';
import '../core/events_query.dart';
import '../models/band_summary.dart';
import '../models/event.dart';
import '../models/province.dart';
import '../services/events_service.dart';
import '../services/locations_service.dart';
import '../state/auth_controller.dart';
import '../widgets/app_decor.dart';
import '../widgets/app_shell_app_bar.dart';
import '../widgets/event_card.dart';
import '../widgets/events_filter_panel.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final EventsService _eventsService = EventsService();
  final LocationsService _locationsService = LocationsService();

  List<Province> _provinces = [];
  List<District> _districts = [];
  List<BandSummary> _bands = [];
  List<Event> _events = [];
  EventsFilters _filters = const EventsFilters();

  bool _loadingMeta = true;
  bool _loadingEvents = true;
  bool _loadingDistricts = false;
  String? _metaError;
  String? _eventsError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  @override
  void dispose() {
    _eventsService.close();
    _locationsService.close();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    await _loadMeta();
    await _loadBandsForLocation();
    await _loadEvents();
  }

  Future<void> _loadMeta() async {
    setState(() {
      _loadingMeta = true;
      _metaError = null;
    });
    try {
      final provinces = await _locationsService.listProvinces();
      if (!mounted) return;
      setState(() => _provinces = provinces);
    } catch (e) {
      if (!mounted) return;
      setState(() => _metaError = e.toString());
    } finally {
      if (mounted) setState(() => _loadingMeta = false);
    }
  }

  Future<void> _loadBandsForLocation({
    String? provinceId,
    String? districtId,
  }) async {
    final p = provinceId ?? _filters.provinceId;
    final d = districtId ?? _filters.districtId;
    try {
      final bands = await _eventsService.listBands(
        provinceId: p.isEmpty ? null : p,
        districtId: d.isEmpty ? null : d,
      );
      if (!mounted) return;
      setState(() => _bands = bands);
    } catch (_) {
      if (!mounted) return;
      setState(() => _bands = []);
    }
  }

  Future<void> _loadDistricts(String provinceId) async {
    setState(() => _loadingDistricts = true);
    try {
      final rows = await _locationsService.listDistricts(provinceId);
      if (!mounted) return;
      setState(() => _districts = rows);
    } catch (_) {
      if (!mounted) return;
      setState(() => _districts = []);
    } finally {
      if (mounted) setState(() => _loadingDistricts = false);
    }
  }

  Future<void> _loadEvents() async {
    final auth = context.read<AuthController>();
    if (!auth.ready) return;

    setState(() {
      _loadingEvents = true;
      _eventsError = null;
    });
    try {
      final events = await _eventsService.listEvents(
        filters: _filters,
        token: auth.token,
      );
      if (!mounted) return;
      setState(() => _events = sortEventsForDisplay(events));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _eventsError = e.toString();
        _events = [];
      });
    } finally {
      if (mounted) setState(() => _loadingEvents = false);
    }
  }

  Future<void> _onProvinceChanged(String? provinceId) async {
    if (provinceId == null || provinceId.isEmpty) {
      setState(() {
        _filters = _filters.copyWith(provinceId: '', districtId: '');
        _districts = [];
      });
      return;
    }
    await _loadDistricts(provinceId);
  }

  Future<void> _applyFilters(EventsFilters filters) async {
    final prevProvince = _filters.provinceId;
    setState(() => _filters = filters);
    if (filters.provinceId.isNotEmpty) {
      if (filters.provinceId != prevProvince) {
        await _loadDistricts(filters.provinceId);
      }
    } else {
      setState(() => _districts = []);
    }
    await _loadEvents();
  }

  void _openFilters() {
    void openSheet() {
      showEventsFilterSheet(
        context: context,
        panel: EventsFilterPanel(
          filters: _filters,
          provinces: _provinces,
          bands: _bands,
          districts: _districts,
          loadingDistricts: _loadingDistricts,
          onApply: (f) => _applyFilters(f),
          onProvinceChanged: _onProvinceChanged,
          onLocationChanged: (provinceId, districtId) => _loadBandsForLocation(
            provinceId: provinceId,
            districtId: districtId,
          ),
        ),
      );
    }

    _loadBandsForLocation().then((_) {
      if (mounted) openSheet();
    });
  }

  int get _activeFilterCount {
    var n = 0;
    if (_filters.q.trim().isNotEmpty) n++;
    if (_filters.provinceId.isNotEmpty) n++;
    if (_filters.districtId.isNotEmpty) n++;
    if (_filters.bandId.isNotEmpty) n++;
    if (_filters.cafeId.trim().isNotEmpty) n++;
    if (_filters.minPrice.trim().isNotEmpty) n++;
    if (_filters.maxPrice.trim().isNotEmpty) n++;
    if (_filters.dateFrom.isNotEmpty) n++;
    if (_filters.dateTo.isNotEmpty) n++;
    return n;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return Scaffold(
      appBar: const AppShellAppBar(),
      body: AmbientBackground(
        child: !_loadingMeta && auth.ready
            ? RefreshIndicator(
                onRefresh: _loadEvents,
                color: AppColors.primary,
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                        child: const _EventsPageHeader(),
                      ),
                    ),
                    if (_metaError != null)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                          child: _InlineNotice(
                            message:
                                'İl ve grup listesi yüklenemedi. Filtreler sınırlı çalışabilir.',
                            onRetry: _loadMeta,
                          ),
                        ),
                      ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: FilledButton.tonalIcon(
                                onPressed: _openFilters,
                                style: FilledButton.styleFrom(
                                  backgroundColor:
                                      AppColors.surfaceContainerHigh,
                                  foregroundColor: AppColors.onSurface,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                ),
                                icon: const Icon(Icons.tune, size: 18),
                                label: Text(
                                  _activeFilterCount > 0
                                      ? 'Filtre ($_activeFilterCount)'
                                      : 'Filtrele',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton.outlined(
                              tooltip: 'Yenile',
                              onPressed:
                                  _loadingEvents ? null : () => _loadEvents(),
                              icon: const Icon(Icons.refresh, size: 20),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (_loadingEvents)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                    )
                  else if (_eventsError != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        child: _StatusCard(
                          title: 'Bağlantı hatası',
                          message: _eventsError!,
                          actionLabel: 'Tekrar dene',
                          onAction: _loadEvents,
                          isError: true,
                        ),
                      ),
                    )
                  else if (_events.isEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        child: _StatusCard(
                          title: 'Etkinlik bulunamadı',
                          message:
                              'Bu filtreye uygun yayın yok. Filtreleri gevşetmeyi veya tarih aralığını genişletmeyi deneyin.',
                          actionLabel: 'Filtreleri aç',
                          onAction: _openFilters,
                        ),
                      ),
                    )
                  else
                    ..._buildEventSlivers(context),
                ],
              ),
            )
            : const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  List<Widget> _buildEventSlivers(BuildContext context) {
    final upcoming =
        _events.where((e) => !isPastEventModel(e)).toList(growable: false);
    final past =
        _events.where((e) => isPastEventModel(e)).toList(growable: false);
    final slivers = <Widget>[];

    void addCards(List<Event> items, {required EdgeInsets padding}) {
      if (items.isEmpty) return;
      slivers.add(
        SliverPadding(
          padding: padding,
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, index) {
                final event = items[index];
                return EventCard(
                  event: event,
                  onTap: () => Navigator.of(ctx).pushNamed(
                    '/events/${event.id}',
                  ),
                );
              },
              childCount: items.length,
            ),
          ),
        ),
      );
    }

    addCards(upcoming, padding: const EdgeInsets.fromLTRB(16, 0, 16, 0));

    if (past.isNotEmpty) {
      slivers.add(
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              16,
              upcoming.isNotEmpty ? 20 : 0,
              16,
              8,
            ),
            child: const SectionLabel('Geçmiş etkinlikler'),
          ),
        ),
      );
      addCards(past, padding: const EdgeInsets.fromLTRB(16, 0, 16, 24));
    } else if (upcoming.isNotEmpty) {
      slivers.add(const SliverToBoxAdapter(child: SizedBox(height: 24)));
    }

    return slivers;
  }
}

class _EventsPageHeader extends StatelessWidget {
  const _EventsPageHeader();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionLabel('Etkinlikler'),
        const SizedBox(height: 6),
        Text(
          'Canlı müzik etkinlikleri',
          style: theme.textTheme.titleLarge,
        ),
        const SizedBox(height: 6),
        Text(
          'Yayında olan etkinlikleri filtreleyip keşfedin.',
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
    this.isError = false,
  });

  final String title;
  final String message;
  final String actionLabel;
  final VoidCallback onAction;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isError
            ? AppColors.errorContainer.withValues(alpha: 0.12)
            : AppColors.surfaceContainer.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isError
              ? AppColors.error.withValues(alpha: 0.35)
              : AppColors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(
              color: isError ? AppColors.error : AppColors.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(message, style: theme.textTheme.bodySmall),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: onAction,
              child: Text(actionLabel),
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineNotice extends StatelessWidget {
  const _InlineNotice({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(message, style: Theme.of(context).textTheme.bodySmall),
          ),
          TextButton(
            onPressed: onRetry,
            child: const Text('Yenile'),
          ),
        ],
      ),
    );
  }
}
