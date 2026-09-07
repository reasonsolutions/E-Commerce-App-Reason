import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Space, Radius } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { Rating } from './Rating';
import { TextLinkButton } from './TextLinkButton';
import type { ProductReviewItem } from '../../api/interfaces';
import { resolveImageUrl } from '../../utils/resolveImageUrl';

const DESCRIPTION_COLLAPSED_LINES = 4;

interface ReviewCardProps {
  review: ProductReviewItem;
  isMine?: boolean;
  onPressImage: (images: string[], index: number) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, isMine, onPressImage }) => {
  const imageUrls = (review.Images ?? []).map(resolveImageUrl);
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Rating value={review.Rating} compact size={13} />
          <Text style={styles.cardTitle} numberOfLines={2}>{review.Title}</Text>
        </View>
        {isMine ? (
          <View style={styles.mineBadge}>
            <Text style={styles.mineBadgeText}>YOUR REVIEW</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={styles.cardDescription}
        numberOfLines={expanded ? undefined : DESCRIPTION_COLLAPSED_LINES}
        onTextLayout={e => {
          if (!expanded && e.nativeEvent.lines.length >= DESCRIPTION_COLLAPSED_LINES) {
            setIsTruncated(true);
          }
        }}
      >
        {review.Description}
      </Text>
      {isTruncated ? (
        <TextLinkButton
          label={expanded ? 'See less' : 'See more'}
          onPress={() => setExpanded(v => !v)}
          style={styles.seeMoreButton}
        />
      ) : null}

      {imageUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
          {imageUrls.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => onPressImage(imageUrls, i)} activeOpacity={0.85}>
              <Image source={{ uri }} style={styles.reviewImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <Text style={styles.cardMeta}>
        {review.Customer?.Name ?? 'Customer'}
        {review.PurchaseHistory?.length > 0 ? ' · Verified Purchase' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth:  StyleSheet.hairlineWidth,
    borderColor:  Colors.rule,
    borderRadius: Radius.md,
    padding:      Space[3],
    gap:          Space[2],
  },
  cardHeaderRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            Space[2],
  },
  cardTitle: {
    fontFamily: FontFamily.serif,
    fontSize:   16,
    color:      Colors.ink1,
    marginTop:  Space[1],
  },
  cardDescription: {
    ...Type.body,
    color: Colors.ink2,
  },
  seeMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 0,
  },
  cardMeta: {
    ...Type.caption,
    color: Colors.ink4,
  },
  mineBadge: {
    backgroundColor:    Colors.surfaceDeep,
    paddingHorizontal:  8,
    paddingVertical:    3,
    borderRadius:       4,
  },
  mineBadgeText: {
    ...Type.label,
    fontSize: 9,
    color:    Colors.ink3,
  },
  imagesRow: {
    marginTop: Space[1],
  },
  reviewImage: {
    width:            64,
    height:           64,
    borderRadius:     Radius.sm,
    marginRight:      Space[2],
    backgroundColor:  Colors.surfaceDeep,
  },
});
