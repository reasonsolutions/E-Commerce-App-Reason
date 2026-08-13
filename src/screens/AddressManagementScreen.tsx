import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { EmptyState, ConfirmSheet, Skeleton } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import {
  getDeliveryAddresses,
  postDeleteDeliveryAddress,
  postUpdateDeliveryAddress,
} from '../api/address';
import { userFacingMessage } from '../api/apiError';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useAppToast } from '../hooks/useAppToast';
import { DeliveryAddress } from './AddressScreen';
import { Motion } from '../theme/motion';
import { AddressLabel } from '../config/enum_files/AddressLabel';
import { COUNTRY_OPTIONS, dialCodeForCountry } from '../config/countries';

type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, any>) => void;
  };
  route?: {
    params?: {
      from?: 'checkout';
    };
  };
};

const LABEL_ICON: Record<AddressLabel, string> = {
  [AddressLabel.Home]: 'home-outline',
  [AddressLabel.Work]: 'briefcase-outline',
  [AddressLabel.Other]: 'location-outline',
};
const LABEL_TEXT: Record<AddressLabel, string> = {
  [AddressLabel.Home]: 'HOME',
  [AddressLabel.Work]: 'WORK',
  [AddressLabel.Other]: 'OTHER',
};

// ── Single address row ────────────────────────────────────────────────────────
const AddressRow: React.FC<{
  item: DeliveryAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  isLast: boolean;
  delay: number;
  isFromCheckout?: boolean;
}> = ({
  item,
  onEdit,
  onDelete,
  onSetPrimary,
  isLast,
  delay,
  isFromCheckout,
}) => {
  const haptic = useHaptic();
  const entrance = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();

  return (
    <Animated.View style={styles.rowWrap}>
      <Animated.View style={[entrance, pressStyle]}>
        <TouchableOpacity
          {...handlers}
          style={styles.addressRow}
          activeOpacity={1}
          onPress={() => {
            haptic.light();
            if (isFromCheckout) {
              onSetPrimary();
            } else {
              onEdit();
            }
          }}
        >
          <View
            style={[
              styles.primaryDot,
              item.IsPrimary && styles.primaryDotActive,
            ]}
          />

          <View style={styles.addressContent}>
            {item.AddressLabel ? (
              <View style={styles.labelChip}>
                <Icon
                  name={LABEL_ICON[item.AddressLabel]}
                  size={11}
                  color={Colors.brandNavy}
                />
                <Text style={styles.labelChipText}>
                  {LABEL_TEXT[item.AddressLabel]}
                </Text>
              </View>
            ) : null}
            <View style={styles.nameRow}>
              <Text style={styles.addressName}>{item.CustomerName}</Text>
              {item.IsPrimary ? (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              ) : null}
            </View>
            {item.Address || item.StreetName ? (
              <Text style={styles.addressLine}>
                {[item.Address, item.StreetName].filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {item.City || item.Zipcode ? (
              <Text style={styles.addressLine}>
                {[item.City, item.Zipcode].filter(Boolean).join(' — ')}
              </Text>
            ) : null}
            {item.Landmark ? (
              <Text style={styles.addressLineMuted}>{item.Landmark}</Text>
            ) : null}
            <View style={styles.addressMobileRow}>
              <Icon name="call-outline" size={11} color={Colors.ink4} />
              <Text style={styles.addressMobile}>
                {dialCodeForCountry(item.CountryCode ?? undefined)} {String(item.MobileNumber)}
              </Text>
            </View>
            {!item.IsPrimary || isFromCheckout ? (
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  onSetPrimary();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 0, right: 6 }}
                style={styles.setPrimaryBtn}
              >
                <Text style={styles.setPrimaryText}>
                  {isFromCheckout
                    ? ' Deliver to this address'
                    : 'Set as default'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.addressActions}>
            <TouchableOpacity
              onPress={() => {
                haptic.light();
                onEdit();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Icon name="pencil-outline" size={16} color={Colors.brandNavy} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                haptic.warning();
                onDelete();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <Icon name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const AddressManagementScreen: React.FC<Props> = ({ navigation, route }) => {
  const isFromCheckout = route?.params?.from === 'checkout';
  const insets = useSafeAreaInsets();
  const {
    data: addresses,
    loading: fetchLoading,
    isError: fetchError,
    error: fetchErrorMsg,
    run,
  } = useAsyncState<DeliveryAddress[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const toast = useAppToast();

  const fetchAddresses = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        const response = await getDeliveryAddresses(user.CustomerProfileCode);
        return response.statusCode === 1
          ? (response.result as DeliveryAddress[])
          : [];
      }, cancelled),
    [run],
  );

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      fetchAddresses(cancelled);
      return () => {
        cancelled.current = true;
      };
    }, [fetchAddresses]),
  );

  const setAsPrimary = async (item: DeliveryAddress) => {
    try {
      const response = await postUpdateDeliveryAddress({
        OrderDeliveryAddressCode: item.OrderDeliveryAddressCode,
        CustomerProfileCode: item.CustomerProfileCode,
        CustomerName: item.CustomerName,
        MobileNumber: Number(item.MobileNumber),
        Address: item.Address ?? '',
        StreetName: item.StreetName ?? '',
        City: item.City ?? '',
        Landmark: item.Landmark ?? '',
        Zipcode: Number(item.Zipcode),
        IsPrimary: 1,
        CountryCode: item.CountryCode ?? COUNTRY_OPTIONS[0].code,
        AddressLabel: item.AddressLabel ?? undefined,
      });
      if (response.statusCode === 1) {
        await fetchAddresses();
        if (isFromCheckout) {
          navigation.goBack();
        }
      } else {
        toast.error({
          title: 'Could not set default address',
          description: response.userMessage || undefined,
        });
      }
    } catch (err) {
      toast.error({
        title: 'Could not set default address',
        description: userFacingMessage(err),
      });
    }
  };

  const requestDelete = (code: number) => setDeleteTarget(code);

  const confirmDelete = async () => {
    const code = deleteTarget;
    if (code === null) return;
    setDeleteTarget(null);
    try {
      const response = await postDeleteDeliveryAddress(code);
      if (response.statusCode === 1) {
        await fetchAddresses();
      } else {
        toast.error({
          title: 'Could not delete address',
          description: response.userMessage || undefined,
        });
      }
    } catch (err) {
      toast.error({
        title: 'Could not delete address',
        description: userFacingMessage(err),
      });
    }
  };

  const addressList = addresses ?? [];
  const showSkeleton = fetchLoading && addressList.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Icon name="chevron-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Addresses</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddAddress', isFromCheckout ? { from: 'checkout' } : undefined)
          }
          style={styles.addBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Add a new address"
        >
          <Icon name="add" size={22} color={Colors.brandNavy} />
        </TouchableOpacity>
      </View>
      <View style={styles.headerDivider} />

      {fetchError ? (
        <ErrorState
          title="Couldn't load addresses"
          message={fetchErrorMsg ?? 'Tap retry to try again.'}
          onRetry={() => fetchAddresses()}
          retryLoading={fetchLoading}
        />
      ) : (
        <FlatList
          data={addressList}
          keyExtractor={item => String(item.OrderDeliveryAddressCode)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Space[8] },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            showSkeleton ? (
              <View style={styles.skeletonWrap}>
                {[0, 1].map(i => (
                  <View key={i} style={styles.skeletonRow}>
                    <Skeleton width={20} height={20} radius={10} />
                    <View style={styles.skeletonLines}>
                      <Skeleton width="55%" height={11} />
                      <Skeleton
                        width="85%"
                        height={9}
                        style={styles.skeletonLine}
                      />
                      <Skeleton
                        width="70%"
                        height={9}
                        style={styles.skeletonLine}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !fetchLoading ? (
              <EmptyState
                icon={
                  <Icon name="location-outline" size={26} color={Colors.ink4} />
                }
                title="No saved addresses."
                body="Add a delivery address to get started."
                action={
                  <TouchableOpacity
                    style={styles.emptyAddBtn}
                    onPress={() =>
                      navigation.navigate('AddAddress', isFromCheckout ? { from: 'checkout' } : undefined)
                    }
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Add address"
                  >
                    <Text style={styles.emptyAddBtnText}>Add Address</Text>
                  </TouchableOpacity>
                }
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <AddressRow
              item={item}
              onEdit={() =>
                navigation.navigate('AddAddress', { editAddress: item })
              }
              onDelete={() => requestDelete(item.OrderDeliveryAddressCode)}
              onSetPrimary={() => setAsPrimary(item)}
              isLast={index === addressList.length - 1}
              delay={Motion.stagger.delay(index)}
              isFromCheckout={isFromCheckout}
            />
          )}
        />
      )}

      {deleteTarget !== null && (
        <ConfirmSheet
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete address?"
          body="This address will be removed from your saved addresses."
          confirmLabel="Delete"
          destructive
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Space[2],
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink1,
    letterSpacing: -0.1,
  },
  addBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Space[2],
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop: Space[5],
  },
  rowWrap: {},
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Space[4],
    gap: Space[3],
  },
  primaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  primaryDotActive: {
    backgroundColor: Colors.brandNavy,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    flexWrap: 'wrap',
  },
  addressContent: {
    flex: 1,
    gap: 3,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: Colors.brandNavyTint,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  labelChipText: {
    ...Type.label,
    fontSize: 10,
    color: Colors.brandNavy,
    letterSpacing: 0.4,
  },
  addressName: {
    ...Type.body,
    color: Colors.ink1,
  },
  addressLine: {
    ...Type.caption,
    color: Colors.ink3,
    lineHeight: 13 * 1.5,
  },
  addressLineMuted: {
    ...Type.caption,
    color: Colors.ink4,
    lineHeight: 13 * 1.5,
  },
  addressMobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressMobile: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.ink4,
    letterSpacing: 0.2,
  },
  setPrimaryBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  setPrimaryText: {
    ...Type.caption,
    color: Colors.brandNavy,
    textDecorationLine: 'underline',
  },
  primaryBadge: {
    backgroundColor: Colors.brandNavy,
    borderRadius: Radius.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    ...Type.label,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  addressActions: {
    flexDirection: 'column',
    gap: Space[3],
    flexShrink: 0,
    paddingTop: 2,
  },
  actionBtn: {
    padding: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginLeft: Space[2] + 6,
  },

  // ── Address fetch skeleton ────────────────────────────────────────────────────
  skeletonWrap: {
    gap: Space[1],
    marginBottom: Space[2],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[3],
    paddingVertical: Space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  skeletonLines: {
    flex: 1,
    gap: Space[1],
  },
  skeletonLine: {
    marginTop: Space[1],
  },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyAddBtn: {
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.brandNavy,
    borderRadius: Radius.pill,
    paddingHorizontal: Space[6],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Space[2],
  },
  emptyAddBtnText: {
    ...Type.bodyStrong,
    color: Colors.brandNavy,
  },
});

export default AddressManagementScreen;
