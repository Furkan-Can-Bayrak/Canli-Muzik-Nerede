import 'package:flutter/material.dart';

import '../core/app_colors.dart';
import '../core/events_query.dart';
import '../models/band_summary.dart';
import '../models/province.dart';
import 'app_decor.dart';
import 'province_district_picker.dart';

class EventsFilterPanel extends StatefulWidget {
  const EventsFilterPanel({
    super.key,
    required this.filters,
    required this.provinces,
    required this.bands,
    required this.districts,
    required this.loadingDistricts,
    required this.onApply,
    required this.onProvinceChanged,
    required this.onLocationChanged,
  });

  final EventsFilters filters;
  final List<Province> provinces;
  final List<BandSummary> bands;
  final List<District> districts;
  final bool loadingDistricts;
  final ValueChanged<EventsFilters> onApply;
  final Future<void> Function(String? provinceId) onProvinceChanged;
  final Future<void> Function(String provinceId, String districtId)
      onLocationChanged;

  @override
  State<EventsFilterPanel> createState() => _EventsFilterPanelState();
}

class _EventsFilterPanelState extends State<EventsFilterPanel> {
  late final TextEditingController _qController;
  late final TextEditingController _minPriceController;
  late final TextEditingController _maxPriceController;
  late String _provinceId;
  late String _districtId;
  late String _bandId;
  DateTime? _dateFrom;
  DateTime? _dateTo;

  @override
  void initState() {
    super.initState();
    _qController = TextEditingController(text: widget.filters.q);
    _minPriceController = TextEditingController(text: widget.filters.minPrice);
    _maxPriceController = TextEditingController(text: widget.filters.maxPrice);
    _provinceId = widget.filters.provinceId;
    _districtId = widget.filters.districtId;
    _bandId = widget.filters.bandId;
    _dateFrom = widget.filters.dateFrom.isEmpty
        ? null
        : DateTime.tryParse(widget.filters.dateFrom);
    _dateTo = widget.filters.dateTo.isEmpty
        ? null
        : DateTime.tryParse(widget.filters.dateTo);
  }

  @override
  void didUpdateWidget(EventsFilterPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.filters != widget.filters) {
      _qController.text = widget.filters.q;
      _minPriceController.text = widget.filters.minPrice;
      _maxPriceController.text = widget.filters.maxPrice;
      _provinceId = widget.filters.provinceId;
      _districtId = widget.filters.districtId;
      _bandId = widget.filters.bandId;
      _dateFrom = widget.filters.dateFrom.isEmpty
          ? null
          : DateTime.tryParse(widget.filters.dateFrom);
      _dateTo = widget.filters.dateTo.isEmpty
          ? null
          : DateTime.tryParse(widget.filters.dateTo);
    }
  }

  @override
  void dispose() {
    _qController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  String _isoDay(DateTime? d) {
    if (d == null) return '';
    return '${d.year.toString().padLeft(4, '0')}-'
        '${d.month.toString().padLeft(2, '0')}-'
        '${d.day.toString().padLeft(2, '0')}';
  }

  Future<void> _pickDate({
    required bool isFrom,
  }) async {
    final initial = isFrom ? _dateFrom : _dateTo;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      locale: const Locale('tr', 'TR'),
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _dateFrom = picked;
      } else {
        _dateTo = picked;
      }
    });
  }

  void _apply() {
    widget.onApply(
      EventsFilters(
        q: _qController.text,
        provinceId: _provinceId,
        districtId: _districtId,
        bandId: _bandId,
        minPrice: _minPriceController.text,
        maxPrice: _maxPriceController.text,
        dateFrom: _isoDay(_dateFrom),
        dateTo: _isoDay(_dateTo),
      ),
    );
    Navigator.of(context).pop();
  }

  void _clear() {
    setState(() {
      _qController.clear();
      _minPriceController.clear();
      _maxPriceController.clear();
      _provinceId = '';
      _districtId = '';
      _bandId = '';
      _dateFrom = null;
      _dateTo = null;
    });
    widget.onProvinceChanged(null);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(
                  'Filtreler',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                TextButton(onPressed: _clear, child: const Text('Temizle')),
              ],
            ),
            const SizedBox(height: 8),
            const SectionLabel('Etkinlik arama'),
            const SizedBox(height: 16),
            TextField(
              controller: _qController,
              decoration: const InputDecoration(
                labelText: 'Mekân veya adres ara',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            ProvinceDistrictPicker(
              provinces: widget.provinces,
              districts: widget.districts,
              provinceId: _provinceId,
              districtId: _districtId,
              loadingDistricts: widget.loadingDistricts,
              onProvinceChanged: (id) async {
                setState(() {
                  _provinceId = id ?? '';
                  _districtId = '';
                  _bandId = '';
                });
                await widget.onProvinceChanged(id);
                await widget.onLocationChanged(_provinceId, _districtId);
              },
              onDistrictChanged: (id) async {
                setState(() {
                  _districtId = id ?? '';
                  _bandId = '';
                });
                await widget.onLocationChanged(_provinceId, _districtId);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              initialValue: _bandId.isEmpty ? null : _bandId,
              decoration: const InputDecoration(
                labelText: 'Grup',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Tüm gruplar'),
                ),
                ...widget.bands.map(
                  (b) => DropdownMenuItem<String?>(
                    value: b.id,
                    child: Text(b.bandName),
                  ),
                ),
              ],
              onChanged: (id) => setState(() => _bandId = id ?? ''),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickDate(isFrom: true),
                    child: Text(
                      _dateFrom == null
                          ? 'Başlangıç tarihi'
                          : _isoDay(_dateFrom),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _pickDate(isFrom: false),
                    child: Text(
                      _dateTo == null ? 'Bitiş tarihi' : _isoDay(_dateTo),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _minPriceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Min fiyat (₺)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _maxPriceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Max fiyat (₺)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _apply, child: const Text('Uygula')),
          ],
        ),
      ),
    );
  }
}

void showEventsFilterSheet({
  required BuildContext context,
  required EventsFilterPanel panel,
}) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppColors.surfaceContainerLow,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => panel,
  );
}
