export type Coordinates = { lat: number; lng: number };

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Tarayıcınız konum özelliğini desteklemiyor."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Konum izni reddedildi."));
        } else {
          reject(new Error("Konum alınamadı."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 },
    );
  });
}
