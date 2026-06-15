-- Türkçe/ASCII duyarsız arama (İ/I, ı/i, ö/o, ş/s, …)
CREATE OR REPLACE FUNCTION normalize_search_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      lower(
                        replace(
                          replace(COALESCE(input, ''), 'İ', 'i'),
                          'I', 'ı'
                        )
                      ),
                      'ğ', 'g'
                    ),
                    'ü', 'u'
                  ),
                  'ş', 's'
                ),
                'ı', 'i'
              ),
              'ö', 'o'
            ),
            'ç', 'c'
          ),
          'â', 'a'
        ),
        'î', 'i'
      ),
      'û', 'u'
    );
$$;
