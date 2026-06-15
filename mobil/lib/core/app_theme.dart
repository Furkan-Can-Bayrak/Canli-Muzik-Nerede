import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

abstract final class AppTheme {
  static ThemeData build() {
    const radius = 16.0;
    final colorScheme = const ColorScheme.dark(
      surface: AppColors.background,
      onSurface: AppColors.onSurface,
      onSurfaceVariant: AppColors.onSurfaceVariant,
      surfaceContainerLowest: Color(0xFF060E20),
      surfaceContainerLow: AppColors.surfaceContainerLow,
      surfaceContainer: AppColors.surfaceContainer,
      surfaceContainerHigh: AppColors.surfaceContainerHigh,
      surfaceContainerHighest: AppColors.surfaceContainerHighest,
      outline: Color(0xFF958EA0),
      outlineVariant: AppColors.outlineVariant,
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      secondary: AppColors.secondary,
      onSecondary: AppColors.onSecondary,
      error: AppColors.error,
      onError: Color(0xFF690005),
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.onErrorContainer,
    );

    final display = GoogleFonts.syneTextTheme();
    final body = GoogleFonts.hankenGroteskTextTheme();
    final mono = GoogleFonts.jetBrainsMonoTextTheme();

    final textTheme = body.copyWith(
      headlineLarge: display.headlineLarge?.copyWith(
        fontWeight: FontWeight.w800,
        color: AppColors.onSurface,
        letterSpacing: -0.5,
      ),
      headlineMedium: display.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: AppColors.onSurface,
        letterSpacing: -0.4,
        fontSize: 24,
      ),
      headlineSmall: display.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        color: AppColors.onSurface,
      ),
      titleLarge: display.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: AppColors.onSurface,
      ),
      titleMedium: display.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
        color: AppColors.onSurface,
      ),
      bodyLarge: body.bodyLarge?.copyWith(
        color: AppColors.onSurface,
        height: 1.5,
      ),
      bodyMedium: body.bodyMedium?.copyWith(
        color: AppColors.onSurfaceVariant,
        height: 1.45,
      ),
      bodySmall: body.bodySmall?.copyWith(color: AppColors.onSurfaceVariant),
      labelSmall: mono.labelSmall?.copyWith(
        color: AppColors.secondary,
        letterSpacing: 1.6,
        fontWeight: FontWeight.w500,
      ),
      labelMedium: mono.labelMedium?.copyWith(
        color: AppColors.onSurfaceVariant,
        letterSpacing: 0.8,
        fontWeight: FontWeight.w500,
      ),
    );

    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: AppColors.outlineVariant.withValues(alpha: 0.4),
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background.withValues(alpha: 0.75),
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: GoogleFonts.syne(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: AppColors.primary,
          letterSpacing: -0.5,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainer,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(
            color: AppColors.outlineVariant.withValues(alpha: 0.25),
          ),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainer.withValues(alpha: 0.6),
        labelStyle: body.bodyMedium?.copyWith(
          color: AppColors.onSurfaceVariant,
        ),
        hintStyle: body.bodyMedium?.copyWith(
          color: AppColors.onSurfaceVariant.withValues(alpha: 0.5),
        ),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputBorder.copyWith(
          borderSide: const BorderSide(
            color: Color(0x80D0BCFF),
            width: 1.2,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryContainer,
          foregroundColor: AppColors.onPrimaryContainer,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: const StadiumBorder(),
          textStyle: body.titleSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.onSurfaceVariant,
          side: BorderSide(
            color: AppColors.outlineVariant.withValues(alpha: 0.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: const StadiumBorder(),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.onSurfaceVariant,
          textStyle: body.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.outlineVariant.withValues(alpha: 0.15),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.surfaceContainerHigh,
        contentTextStyle: body.bodyMedium?.copyWith(color: AppColors.onSurface),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      dropdownMenuTheme: DropdownMenuThemeData(
        menuStyle: MenuStyle(
          backgroundColor: WidgetStatePropertyAll(AppColors.surfaceContainer),
        ),
      ),
    );
  }
}
