import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

/** Current position + a readable address. Throws a user-facing message if permission is refused. */
export async function currentPlace() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission is needed to mark attendance and log visits.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const lat = Number(pos.coords.latitude.toFixed(6));
  const lng = Number(pos.coords.longitude.toFixed(6));
  let address = `${lat}, ${lng}`;
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (a) address = [a.name, a.street, a.district, a.city, a.region, a.postalCode].filter(Boolean).join(', ').slice(0, 280) || address;
  } catch { /* offline: keep coordinates */ }
  return { lat, lng, address, accuracy: Math.round(pos.coords.accuracy || 0) };
}

/** Front-camera selfie. Returns a local file uri, or null if the user cancels. */
export async function takeSelfie() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Camera permission is needed for the attendance selfie.');
  const r = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.4, allowsEditing: false });
  if (r.canceled || !r.assets?.length) return null;
  return r.assets[0].uri;
}
