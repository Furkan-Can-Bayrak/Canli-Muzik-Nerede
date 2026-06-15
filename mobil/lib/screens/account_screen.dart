import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/app_colors.dart';
import '../state/auth_controller.dart';
import '../widgets/app_decor.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _loading = true;
  bool _deleting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _guardAndLoad());
  }

  Future<void> _guardAndLoad() async {
    final auth = context.read<AuthController>();
    if (!auth.isLoggedIn) {
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/login');
      return;
    }
    try {
      await auth.refreshProfile();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmDelete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceContainer,
        title: const Text('Hesabı sil'),
        content: const Text(
          'Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Vazgeç'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await context.read<AuthController>().deleteAccount();
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    final created = user?.createdAt;

    return Scaffold(
      appBar: AppBar(title: const Text('Hesabım')),
      body: AmbientBackground(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_error != null) ...[
                      Text(
                        _error!,
                        style: TextStyle(color: AppColors.error),
                      ),
                      const SizedBox(height: 16),
                    ],
                    GlassCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SectionLabel('Profil'),
                          const SizedBox(height: 12),
                          _InfoRow(
                            label: 'E-posta',
                            value: user?.email ?? '—',
                          ),
                          const SizedBox(height: 12),
                          _InfoRow(
                            label: 'Görünen ad',
                            value: user?.displayName?.trim().isNotEmpty == true
                                ? user!.displayName!
                                : '—',
                          ),
                          const SizedBox(height: 12),
                          _InfoRow(
                            label: 'Üyelik',
                            value: created != null
                                ? DateFormat('d MMMM yyyy', 'tr_TR')
                                    .format(created.toLocal())
                                : '—',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () async {
                        await auth.logout();
                        if (!context.mounted) return;
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                      icon: const Icon(Icons.logout_outlined),
                      label: const Text('Çıkış yap'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _deleting ? null : _confirmDelete,
                      child: _deleting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              'Hesabı sil',
                              style: TextStyle(color: AppColors.error),
                            ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: Theme.of(context).textTheme.labelMedium,
        ),
        const SizedBox(height: 4),
        Text(value, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}
