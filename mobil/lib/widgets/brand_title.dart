import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/app_colors.dart';

/// AppBar için iki satırlı marka: üstte "Canlı Müzik", altta vurgulu "Nerede".
class BrandTitle extends StatelessWidget {
  const BrandTitle({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Canlı Müzik',
          style: GoogleFonts.hankenGrotesk(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppColors.onSurfaceVariant,
            height: 1.0,
            letterSpacing: 0.2,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          'Nerede',
          style: GoogleFonts.syne(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: AppColors.primary,
            height: 1.0,
            letterSpacing: -0.6,
          ),
        ),
      ],
    );
  }
}
