import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Legal'>;
  route:      RouteProp<RootStackParamList, 'Legal'>;
};

const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide when you create an account, place orders, or contact us — including your name, email address, phone number, and delivery address. We also collect information about your device and how you use the app.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use your information to process orders and payments, deliver products, send order updates and notifications, improve our services, and comply with legal obligations. We do not sell your personal information to third parties.',
  },
  {
    title: 'Data Security',
    body: 'We use industry-standard security measures to protect your data in transit and at rest. Authentication tokens are stored in your device\'s secure keychain. Payment transactions are processed by our payment provider and we do not store payment card details.',
  },
  {
    title: 'Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us.',
  },
  {
    title: 'Cookies and Analytics',
    body: 'We may collect anonymised usage data to understand how customers use the app and improve the experience. This data cannot be used to identify you personally.',
  },
  {
    title: 'Contact Us',
    body: 'If you have questions about this Privacy Policy or how we handle your data, please contact our support team through the Help Center.',
  },
];

const TERMS_SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By creating an account or using EasyCom, you agree to these Terms of Service. If you do not agree, please do not use the app.',
  },
  {
    title: 'Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorised use.',
  },
  {
    title: 'Orders and Payments',
    body: 'When you place an order you are making an offer to purchase. We reserve the right to cancel orders in the event of pricing errors, stock unavailability, or suspected fraud. Payment is charged at the time of order confirmation.',
  },
  {
    title: 'Prohibited Use',
    body: 'You may not use EasyCom for any unlawful purpose, to transmit harmful or fraudulent content, or to attempt to gain unauthorised access to our systems.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, EasyCom is not liable for indirect, incidental, or consequential damages arising from your use of the app or services.',
  },
  {
    title: 'Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of the app after changes are posted constitutes acceptance of the updated Terms.',
  },
];

const LegalScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets   = useSafeAreaInsets();
  const isPrivacy = route.params.type === 'privacy';
  const title     = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const sections  = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Space[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: Space[4],
    paddingBottom:   Space[3],
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width:  36,
    height: 36,
    justifyContent: 'center',
    alignItems:     'flex-start',
  },
  headerTitle: {
    flex:        1,
    textAlign:   'center',
    fontFamily:  FontFamily.sans,
    fontSize:    15,
    fontWeight:  '500',
    color:       Colors.ink1,
    letterSpacing: 0.1,
  },
  headerRight: {
    width: 36,
  },
  headerDivider: {
    height:          1,
    backgroundColor: Colors.surfaceDeep,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space[5],
    paddingTop:        Space[6],
  },
  section: {
    marginBottom: Space[6],
  },
  sectionTitle: {
    ...Type.bodyStrong,
    color:        Colors.ink1,
    marginBottom: Space[2],
  },
  sectionBody: {
    ...Type.body,
    color:      Colors.ink2,
    lineHeight: 22,
  },
  lastUpdated: {
    ...Type.caption,
    color:      Colors.ink4,
    marginTop:  Space[4],
    textAlign:  'center',
  },
});

export default LegalScreen;
