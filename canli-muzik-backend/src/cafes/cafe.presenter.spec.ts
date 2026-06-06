import { presentCafe } from './cafe.presenter';

describe('presentCafe', () => {
  const cafe = {
    userId: 'u1',
    name: 'Mekan',
    provinceId: 'p1',
    districtId: 'd1',
    address: 'Adres adres',
    latitude: 41.0,
    longitude: 29.0,
    phone: '+905551112233',
    description: null,
    province: { id: 'p1', name: 'İstanbul', plateCode: '34' },
    district: { id: 'd1', name: 'Kadıköy' },
  };

  it('hides phone when not allowed', () => {
    const out = presentCafe(cafe, false);
    expect(out.phone).toBeUndefined();
    expect(out.province).toEqual({ id: 'p1', name: 'İstanbul', plateCode: '34' });
  });

  it('shows phone when allowed', () => {
    const out = presentCafe(cafe, true);
    expect(out.phone).toBe('+905551112233');
  });
});
