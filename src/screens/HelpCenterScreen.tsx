import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useHaptic } from '../hooks/useHaptic';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HelpCenterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

interface FaqItem {
  question: string;
  answer:   string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Orders',
    items: [
      {
        question: 'How do I track my order?',
        answer: 'Go to Orders from your Profile or the bottom navigation. Tap any order to see its current status and delivery progress.',
      },
      {
        question: 'Can I cancel an order after placing it?',
        answer: 'Yes, as long as the order has not shipped yet. Open the order from Orders > Order Details and tap Cancel Order.',
      },
      {
        question: 'I want to reorder items from a past order. Is that possible?',
        answer: 'Yes. Open the order in Orders and tap Reorder — the items will be added to your bag at their current price and availability.',
      },
    ],
  },
  {
    title: 'Shipping & Delivery',
    items: [
      {
        question: 'How long does delivery take?',
        answer: 'Delivery timelines vary by product and are shown on the product page and at checkout. Most orders arrive within the estimated delivery window shown there.',
      },
      {
        question: 'Is shipping free?',
        answer: 'Many products ship free — this is shown on the product page and in your bag before checkout.',
      },
    ],
  },
  {
    title: 'Returns & Refunds',
    items: [
      {
        question: 'What is the return policy?',
        answer: 'Return eligibility and the return window vary by product. Check the product page for return policy details before purchasing.',
      },
      {
        question: 'How do I request a refund?',
        answer: 'Refunds are processed automatically once a return or cancellation is approved, using your original payment method.',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'What payment methods are accepted?',
        answer: 'Available payment methods are shown at checkout and may include cash on delivery and online payment options depending on your order.',
      },
      {
        question: 'Is it safe to pay on this app?',
        answer: 'Yes. All payments are processed securely, and we never store your full card details on our servers.',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        question: 'How do I change my password?',
        answer: 'Go to Profile > Change Password and enter your current and new password.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Contact support using the Contact Us option in Profile to request account deletion.',
      },
    ],
  },
];

const FaqRow: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const haptic = useHaptic();

  const toggle = useCallback(() => {
    haptic.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, [haptic]);

  return (
    <TouchableOpacity
      style={styles.faqRow}
      onPress={toggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={item.question}
    >
      <View style={styles.faqQuestionRow}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Icon
          name={expanded ? 'remove' : 'add'}
          size={18}
          color={Colors.ink3}
        />
      </View>
      {expanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
    </TouchableOpacity>
  );
};

const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {FAQ_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.question}>
                  {idx > 0 && <View style={styles.faqDivider} />}
                  <FaqRow item={item} />
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── Light header ────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    width: 32,
  },
  headerTitle: {
    flex:       1,
    textAlign:  'center',
    ...Type.heading,
    color:      Colors.ink1,
  },
  headerRight: {
    width: 32,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[8],
  },
  section: {
    marginBottom: Space[6],
  },
  sectionTitle: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.6,
    marginBottom:  Space[3],
  },
  sectionCard: {
    backgroundColor: Colors.surfaceSoft,
    borderRadius:    16,
    paddingHorizontal: Space[4],
  },
  faqDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  faqRow: {
    paddingVertical: Space[4],
  },
  faqQuestionRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            Space[3],
  },
  faqQuestion: {
    flex:       1,
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '500',
    color:      Colors.ink1,
    lineHeight: 21,
  },
  faqAnswer: {
    ...Type.caption,
    color:     Colors.ink3,
    marginTop: Space[2],
    lineHeight: 19,
  },
});

export default HelpCenterScreen;
