import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { useTactile } from '../../hooks/useTactile';
import { useHaptic } from '../../hooks/useHaptic';
import { ErrorBanner } from './ErrorBanner';
import { postReview } from '../../api/auth';
import { userFacingMessage } from '../../api/apiError';

interface RateAppSheetProps {
  customerProfileCode: number;
  customerFirstName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const STAR_VALUES = [1, 2, 3, 4, 5];
const COMMENT_MAX = 500;

const SubmitButton: React.FC<{
  label: string;
  disabled: boolean;
  onPress: () => void;
}> = ({ label, disabled, onPress }) => {
  const { animatedStyle, handlers } = useTactile();
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        {...handlers}
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        style={[styles.btn, disabled && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const RateAppSheet: React.FC<RateAppSheetProps> = ({
  customerProfileCode,
  customerFirstName,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleSubmit = async () => {
    if (submitting || rating === 0) return;
    Keyboard.dismiss();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await postReview({
        CustomerProfileCode: customerProfileCode,
        Rating: rating,
        Description: comment.trim(),
      });

      if (res?.statusCode !== 1) {
        setSubmitError(res?.userMessage || 'Failed to submit your review. Please try again.');
        setSubmitting(false);
        return;
      }

      haptic.success();
      setSubmitting(false);
      onSuccess();
    } catch (err) {
      setSubmitError(userFacingMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + Space[6],
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={22} color={Colors.ink3} />
            </TouchableOpacity>
          </View>

          <View style={styles.inner}>
            {customerFirstName ? (
              <Text style={styles.greeting}>Hey, {customerFirstName}!</Text>
            ) : null}
            <Text style={styles.title}>Could you please rate our app?</Text>
            <Text style={styles.body}>
              Your ratings help us understand what you love and what we can
              improve, making your experience even better. It&apos;s a
              win-win!
            </Text>

            <View style={styles.starsRow}>
              {STAR_VALUES.map(value => (
                <TouchableOpacity
                  key={value}
                  onPress={() => { haptic.light(); setRating(value); }}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Icon
                    name={value <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={Colors.star}
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.commentWrap}>
              <TextInput
                style={styles.commentInput}
                placeholder="Describe your experience (optional)"
                placeholderTextColor={Colors.ink5}
                multiline
                maxLength={COMMENT_MAX}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
              <Text style={styles.commentCount}>{comment.length}/{COMMENT_MAX}</Text>
            </View>

            {submitError ? (
              <ErrorBanner body={submitError} onRetry={() => setSubmitError(null)} />
            ) : null}

            <View style={styles.actions}>
              <SubmitButton
                label={submitting ? '···' : 'Submit'}
                disabled={rating === 0 || submitting}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOuter: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.rule,
    alignSelf: 'center',
    marginTop: Space[2],
    marginBottom: Space[1],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Space[6],
  },
  inner: {
    paddingHorizontal: Space[6],
    paddingTop: Space[1],
    gap: Space[3],
  },
  greeting: {
    fontFamily: FontFamily.serif,
    fontSize: 19,
    fontWeight: '400',
    color: Colors.ink1,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  title: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    fontWeight: '400',
    color: Colors.ink1,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    ...Type.caption,
    color: Colors.ink3,
    lineHeight: 13 * 1.55,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Space[2],
  },
  star: {
    marginHorizontal: Space[2],
  },
  commentWrap: {
    marginTop: Space[2],
  },
  commentInput: {
    ...Type.body,
    color: Colors.ink1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.rule,
    borderRadius: Radius.sm,
    padding: Space[3],
    minHeight: 90,
  },
  commentCount: {
    ...Type.caption,
    color: Colors.ink5,
    textAlign: 'right',
    marginTop: Space[1],
  },
  actions: {
    marginTop: Space[2],
  },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: Space[4],
    borderRadius: Radius.pill,
    alignItems: 'center',
    backgroundColor: Colors.ink1,
  },
  btnDisabled: {
    backgroundColor: Colors.ink4,
  },
  btnText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});
