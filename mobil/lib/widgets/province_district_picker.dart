import 'package:flutter/material.dart';

import '../models/province.dart';

class ProvinceDistrictPicker extends StatelessWidget {
  const ProvinceDistrictPicker({
    super.key,
    required this.provinces,
    required this.districts,
    required this.provinceId,
    required this.districtId,
    required this.onProvinceChanged,
    required this.onDistrictChanged,
    this.loadingDistricts = false,
  });

  final List<Province> provinces;
  final List<District> districts;
  final String provinceId;
  final String districtId;
  final ValueChanged<String?> onProvinceChanged;
  final ValueChanged<String?> onDistrictChanged;
  final bool loadingDistricts;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DropdownButtonFormField<String?>(
          initialValue: provinceId.isEmpty ? null : provinceId,
          decoration: const InputDecoration(
            labelText: 'İl',
            border: OutlineInputBorder(),
          ),
          items: [
            const DropdownMenuItem<String?>(value: null, child: Text('Tümü')),
            ...provinces.map(
              (p) => DropdownMenuItem<String?>(
                value: p.id,
                child: Text(p.name),
              ),
            ),
          ],
          onChanged: onProvinceChanged,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String?>(
          initialValue: districtId.isEmpty ? null : districtId,
          decoration: InputDecoration(
            labelText: 'İlçe',
            border: const OutlineInputBorder(),
            suffixIcon: loadingDistricts
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
          ),
          items: [
            const DropdownMenuItem<String?>(value: null, child: Text('Tümü')),
            ...districts.map(
              (d) => DropdownMenuItem<String?>(
                value: d.id,
                child: Text(d.name),
              ),
            ),
          ],
          onChanged: provinceId.isEmpty ? null : onDistrictChanged,
        ),
      ],
    );
  }
}
