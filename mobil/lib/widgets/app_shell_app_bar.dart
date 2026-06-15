import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_colors.dart';
import '../state/auth_controller.dart';
import 'brand_title.dart';

class AppShellAppBar extends StatelessWidget implements PreferredSizeWidget {
  const AppShellAppBar({super.key, this.title});

  /// Alt sayfalarda tek satır başlık; null ise marka logosu gösterilir.
  final String? title;

  @override
  Size get preferredSize => Size.fromHeight(title == null ? 56 : kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    return AppBar(
      toolbarHeight: title == null ? 56 : kToolbarHeight,
      title: title != null ? Text(title!) : const BrandTitle(),
      titleSpacing: 16,
      centerTitle: false,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: AppColors.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      actions: [
        if (!auth.isLoggedIn)
          PopupMenuButton<String>(
            tooltip: 'Hesap',
            icon: const Icon(Icons.person_outline),
            onSelected: (value) {
              Navigator.of(context).pushNamed(value);
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: '/login', child: Text('Giriş yap')),
              PopupMenuItem(value: '/register', child: Text('Kayıt ol')),
            ],
          )
        else ...[
          IconButton(
            tooltip: 'Hesabım',
            onPressed: () => Navigator.of(context).pushNamed('/account'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
          IconButton(
            tooltip: 'Çıkış',
            onPressed: () => auth.logout(),
            icon: const Icon(Icons.logout_outlined),
          ),
        ],
        const SizedBox(width: 4),
      ],
    );
  }
}
