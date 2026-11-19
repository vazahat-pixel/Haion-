import { createElement as h } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from './config';

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.side, paddingTop: 44, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 },
  back: { color: '#fff', fontSize: 16, marginRight: 14 },
  body: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  cardTitle: { fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  muted: { color: COLORS.muted, fontSize: 13 },
  label: { fontWeight: '700', color: COLORS.text, marginBottom: 4, fontSize: 13 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: COLORS.danger, marginTop: 4 },
  ok: { color: COLORS.success },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tile: { backgroundColor: COLORS.primary, borderRadius: 6, padding: 16, width: '47%', minHeight: 84, justifyContent: 'flex-end' },
  tileText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export const Header = ({ title, onBack, right }) => h(View, { style: s.header },
  onBack ? h(Pressable, { onPress: onBack, accessibilityRole: 'button', accessibilityLabel: 'Back' }, h(Text, { style: s.back }, '‹ Back')) : null,
  h(Text, { style: s.headerText, numberOfLines: 1 }, title), right || null);

export const Button = ({ title, onPress, color, disabled, busy }) => h(Pressable, {
  onPress, disabled: disabled || busy, accessibilityRole: 'button',
  style: [s.btn, color ? { backgroundColor: color } : null, disabled || busy ? { opacity: 0.6 } : null],
}, busy ? h(ActivityIndicator, { color: '#fff' }) : h(Text, { style: s.btnText }, title));

export const Field = ({ label, error, ...p }) => h(View, null,
  h(Text, { style: s.label }, label),
  h(TextInput, { style: [s.input, error ? { borderColor: COLORS.danger } : null], placeholderTextColor: '#999', ...p }),
  error ? h(Text, { style: s.error }, error) : null);

export const Choice = ({ label, options, value, onChange }) => h(View, null,
  h(Text, { style: s.label }, label),
  h(View, { style: s.row }, options.map((o) => h(Pressable, {
    key: o.value, onPress: () => onChange(o.value), accessibilityRole: 'radio', accessibilityState: { selected: value === o.value },
    style: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: value === o.value ? COLORS.primary : '#fff' },
  }, h(Text, { style: { color: value === o.value ? '#fff' : COLORS.primary } }, o.label)))));

export const Card = ({ title, children, onPress }) => h(onPress ? Pressable : View, { style: s.card, onPress }, title ? h(Text, { style: s.cardTitle }, title) : null, children);
export const Muted = ({ children }) => h(Text, { style: s.muted }, children);
export const Err = ({ children }) => (children ? h(Text, { style: s.error }, children) : null);

export const isoDate = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const validDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
