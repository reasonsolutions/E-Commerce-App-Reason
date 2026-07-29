import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { STORAGE_KEYS, scopedKey } from '../../config/storageKeys';
import { getDeliveryAddresses } from '../../api/address';
import { AddressLabel } from '../../config/enum_files/AddressLabel';
import type { DeliveryAddress } from '../../screens/AddressScreen';

const LABEL_TEXT: Record<AddressLabel, string> = {
  [AddressLabel.Home]:  'HOME',
  [AddressLabel.Work]:  'WORK',
  [AddressLabel.Other]: 'OTHER',
};

const addressLine = (a: DeliveryAddress): string =>
  [a.City, a.Zipcode].filter(Boolean).join(' ');

// Falls back to most-recently-created only when no address is marked
// primary yet (e.g. a brand-new account with exactly one address).
const mostRecent = (list: DeliveryAddress[]): DeliveryAddress | null =>
  list.length === 0
    ? null
    : [...list].sort(
        (a, b) => new Date(b.CreatedDate).getTime() - new Date(a.CreatedDate).getTime(),
      )[0];

const defaultAddress = (list: DeliveryAddress[]): DeliveryAddress | null =>
  list.find(a => a.IsPrimary) ?? mostRecent(list);

interface DeliverToRowProps {
  onAddAddress: () => void;
}

export const DeliverToRow: React.FC<DeliverToRowProps> = ({ onAddAddress }) => {
  const [addresses, setAddresses]       = useState<DeliveryAddress[] | null>(null);
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen]       = useState(false);

  // Always fetches fresh from the server on every focus — no local cache, so
  // adds/edits/deletes made in AddressManagementScreen are reflected the next
  // time this row is shown, with no invalidation wiring required elsewhere.
  const load = useCallback(async () => {
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    if (!userRaw) {
      setAddresses(null);
      return;
    }
    const profileCode: number | null = JSON.parse(userRaw)?.CustomerProfileCode ?? null;
    if (!profileCode) {
      setAddresses(null);
      return;
    }

    const res = await getDeliveryAddresses(profileCode).catch(() => null);
    const list: DeliveryAddress[] =
      res?.statusCode === 1 && Array.isArray(res.result) ? res.result : [];
    setAddresses(list);
    setSelectedCode(defaultAddress(list)?.OrderDeliveryAddressCode ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSelect = useCallback(async (address: DeliveryAddress) => {
    setSelectedCode(address.OrderDeliveryAddressCode);
    setSheetOpen(false);
    await AsyncStorage.setItem(
      scopedKey('selectedDeliveryAddress', address.CustomerProfileCode),
      String(address.OrderDeliveryAddressCode),
    );
  }, []);

  // Guests have no addresses to show or add here — stays hidden. Logged-in
  // users with zero saved addresses still get the row, as a CTA straight
  // into add-address, since "Add a new address" is now reachable from here.
  if (addresses === null) return null;

  const selected =
    addresses.length > 0
      ? addresses.find(a => a.OrderDeliveryAddressCode === selectedCode) ?? addresses[0]
      : null;

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => (selected ? setSheetOpen(true) : onAddAddress())}
      >
        <Icon name="location-outline" size={16} color={Colors.ink2} />
        <Text style={styles.text} numberOfLines={1}>
          {selected ? (
            <>
              Deliver to{' '}
              <Text style={styles.textStrong}>
                {selected.CustomerName} - {addressLine(selected)}
              </Text>
            </>
          ) : (
            <Text style={styles.textStrong}>Add a delivery address</Text>
          )}
        </Text>
        <Icon name={selected ? 'chevron-down' : 'chevron-forward'} size={14} color={Colors.ink3} />
      </TouchableOpacity>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setSheetOpen(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.indicatorWrapper}>
            <View style={styles.indicator} />
          </View>

          <Text style={[Type.label, { color: Colors.ink3, paddingHorizontal: Space[5] }]}>
            DELIVER TO
          </Text>

          {addresses.map(a => {
            const isSelected = a.OrderDeliveryAddressCode === selected?.OrderDeliveryAddressCode;
            return (
              <TouchableOpacity
                key={a.OrderDeliveryAddressCode}
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => handleSelect(a)}
              >
                <View style={styles.optionContent}>
                  {a.AddressLabel ? (
                    <Text style={styles.optionLabel}>{LABEL_TEXT[a.AddressLabel]}</Text>
                  ) : null}
                  <Text style={styles.optionName}>{a.CustomerName}</Text>
                  <Text style={styles.optionAddress} numberOfLines={2}>
                    {[a.Address, a.StreetName].filter(Boolean).join(', ')}
                    {a.City || a.Zipcode ? ` — ${addressLine(a)}` : ''}
                  </Text>
                </View>
                {isSelected ? (
                  <Icon name="checkmark-circle" size={20} color={Colors.ink1} />
                ) : (
                  <View style={styles.optionRadio} />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addRow}
            activeOpacity={0.7}
            onPress={() => {
              setSheetOpen(false);
              onAddAddress();
            }}
          >
            <Icon name="add-circle-outline" size={20} color={Colors.ink1} />
            <Text style={styles.addRowText}>Add a new address</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:         'center',
    gap:                Space[2],
    paddingHorizontal:  Space[4],
    paddingVertical:    Space[2] + 2,
  },
  text: {
    flex:       1,
    fontFamily: FontFamily.sans,
    fontSize:   13,
    color:      Colors.ink2,
  },
  textStrong: {
    fontFamily: FontFamily.sans,
    fontWeight: '600',
    color:      Colors.ink1,
  },
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingBottom:        Space[8],
    maxHeight:            '70%',
  },
  indicatorWrapper: {
    width:           '100%',
    paddingVertical: Space[2],
    alignItems:      'center',
  },
  indicator: {
    width:           40,
    height:          4,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.rule,
  },
  optionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingHorizontal: Space[5],
    paddingVertical:   Space[3],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    marginTop:         Space[2],
  },
  optionContent: {
    flex: 1,
    gap:  2,
  },
  optionLabel: {
    fontFamily:    'JetBrainsMono-Regular',
    fontSize:      10,
    letterSpacing: 0.4,
    color:         Colors.ink3,
  },
  optionName: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    fontWeight: '600',
    color:      Colors.ink1,
  },
  optionAddress: {
    fontFamily: FontFamily.sans,
    fontSize:   12,
    color:      Colors.ink3,
  },
  optionRadio: {
    width:        20,
    height:       20,
    borderRadius: 10,
    borderWidth:  1.5,
    borderColor:  Colors.rule,
  },
  addRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingHorizontal: Space[5],
    paddingVertical:   Space[3],
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    marginTop:         Space[2],
  },
  addRowText: {
    fontFamily: FontFamily.sans,
    fontSize:   14,
    fontWeight: '600',
    color:      Colors.ink1,
  },
});
