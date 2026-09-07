import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { PrimaryButton } from './PrimaryButton';
import { ErrorBanner } from './ErrorBanner';
import { useReviewImagePicker, MAX_REVIEW_IMAGES } from '../../hooks/useReviewImagePicker';
import { useHaptic } from '../../hooks/useHaptic';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.85;
const STAR_VALUES = [1, 2, 3, 4, 5];
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 1000;

interface AddReviewSheetProps {
  itemName?: string;
  submitting: boolean;
  submitError: string | null;
  // When set, the sheet pre-fills from this review and submits an edit
  // instead of a new review.
  initialReview?: {
    rating: number;
    title: string;
    description: string;
    images: string[];
  } | null;
  onSubmit: (payload: { rating: number; title: string; description: string; images: string[] }) => void;
  onClose: () => void;
}

// Mirrors ReturnOrderSheet: plain Modal + ScrollView, not @gorhom/bottom-sheet —
// same gesture-handler conflict applies here.
export const AddReviewSheet: React.FC<AddReviewSheetProps> = ({
  itemName,
  submitting,
  submitError,
  initialReview,
  onSubmit,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const isEditing = !!initialReview;
  const sheetHeight = Math.min(SHEET_H, SCREEN_H - insets.top - Space[4]);

  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [title, setTitle] = useState(initialReview?.title ?? '');
  const [description, setDescription] = useState(initialReview?.description ?? '');

  const {
    images,
    canAddMore,
    pickerError,
    pickFromLibrary,
    pickFromCamera,
    removeAt,
    reset: resetImages,
  } = useReviewImagePicker();

  useEffect(() => {
    if (initialReview?.images.length) resetImages(initialReview.images);
    // Pre-fill only on mount — the sheet is remounted (not re-rendered in
    // place) whenever it's opened, so this never needs to react to prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = rating > 0 && title.trim().length > 0 && description.trim().length > 0 && !submitting;

  const handleAddPhoto = () => {
    if (!canAddMore) return;
    haptic.light();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) pickFromCamera();
          if (buttonIndex === 2) pickFromLibrary();
        },
      );
    } else {
      Alert.alert('Add Photo', undefined, [
        { text: 'Take Photo', onPress: () => pickFromCamera() },
        { text: 'Choose from Library', onPress: () => pickFromLibrary() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    onSubmit({ rating, title: title.trim(), description: description.trim(), images });
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalOuter}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        />

        <View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHeaderRow}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>{isEditing ? 'Edit Your Review' : 'Write a Review'}</Text>
              {itemName ? (
                <Text style={styles.sheetSubtitle} numberOfLines={1}>{itemName}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="close" size={22} color={Colors.ink3} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
              <Text style={styles.sheetSectionLabel}>YOUR RATING</Text>
              <View style={styles.starsRow}>
                {STAR_VALUES.map(value => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => { haptic.light(); setRating(value); }}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Icon
                      name={value <= rating ? 'star' : 'star-outline'}
                      size={30}
                      color={Colors.star}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sheetSectionLabel, { marginTop: Space[5] }]}>TITLE</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Summarize your review"
                placeholderTextColor={Colors.ink4}
                maxLength={TITLE_MAX}
              />

              <Text style={[styles.sheetSectionLabel, { marginTop: Space[5] }]}>REVIEW</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What did you like or dislike?"
                placeholderTextColor={Colors.ink4}
                multiline
                maxLength={DESCRIPTION_MAX}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/{DESCRIPTION_MAX}</Text>

              <Text style={[styles.sheetSectionLabel, { marginTop: Space[3] }]}>
                PHOTOS (OPTIONAL)
              </Text>
              <View style={styles.photosRow}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.photoThumbWrap}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      onPress={() => removeAt(i)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Icon name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {canAddMore ? (
                  <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddPhoto}>
                    <Icon name="camera-outline" size={22} color={Colors.ink3} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.charCount}>{images.length}/{MAX_REVIEW_IMAGES} photos</Text>

              {pickerError ? <Text style={styles.sheetError}>{pickerError}</Text> : null}
              {submitError ? <ErrorBanner body={submitError} /> : null}
            </ScrollView>

            <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + Space[4] }]}>
              <PrimaryButton
                label={isEditing ? 'Update Review' : 'Submit Review'}
                onPress={handleSubmit}
                isDisabled={!canSubmit}
                loading={submitting}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOuter: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  sheet: {
    backgroundColor:      Colors.surface,
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight:            SHEET_H,
    flexShrink:           1,
    overflow:             'hidden',
  },
  keyboardArea: {
    flex: 1,
  },
  handle: {
    backgroundColor: Colors.rule,
    width:           36,
    height:          4,
    borderRadius:    2,
    alignSelf:       'center',
    marginTop:       Space[2],
    marginBottom:    Space[2],
  },
  sheetScroll: {
    flexGrow:   1,
    flexShrink: 1,
  },
  sheetContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[4],
  },
  sheetHeaderRow: {
    flexDirection:      'row',
    alignItems:         'flex-start',
    justifyContent:     'space-between',
    gap:                Space[3],
    paddingHorizontal:  Space.screenH,
    paddingBottom:      Space[3],
    borderBottomWidth:  StyleSheet.hairlineWidth,
    borderBottomColor:  Colors.rule,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    ...Type.caption,
    color:     Colors.ink3,
    marginTop: Space[1],
  },
  sheetSectionLabel: {
    ...Type.label,
    color:        Colors.ink4,
    marginBottom: Space[3],
  },
  starsRow: {
    flexDirection: 'row',
  },
  star: {
    marginRight: Space[2],
  },
  titleInput: {
    ...Type.body,
    color:             Colors.ink1,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    borderRadius:      Radius.sm,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[3],
  },
  descriptionInput: {
    ...Type.body,
    color:             Colors.ink1,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    borderRadius:      Radius.sm,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[3],
    minHeight:         96,
  },
  charCount: {
    ...Type.caption,
    color:     Colors.ink5,
    textAlign: 'right',
    marginTop: Space[1],
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Space[2],
  },
  photoThumbWrap: {
    position: 'relative',
  },
  photoThumb: {
    width:        64,
    height:       64,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceDeep,
  },
  photoRemoveBtn: {
    position:        'absolute',
    top:             -6,
    right:           -6,
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  photoAddBtn: {
    width:           64,
    height:          64,
    borderRadius:    Radius.sm,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     Colors.rule,
    borderStyle:     'dashed',
    alignItems:      'center',
    justifyContent:  'center',
  },
  sheetError: {
    ...Type.caption,
    color:     Colors.danger,
    marginTop: Space[3],
    textAlign: 'center',
  },
  ctaWrap: {
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingTop:        Space[4],
    paddingHorizontal: Space.screenH,
  },
});
