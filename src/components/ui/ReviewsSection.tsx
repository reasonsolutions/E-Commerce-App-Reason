import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space } from '../../theme';
import { Type } from '../../theme/typography';
import { FontFamily } from '../../theme/fonts';
import { Rating } from './Rating';
import { TextLinkButton } from './TextLinkButton';
import { ReviewImageViewer } from './ReviewImageViewer';
import { ReviewCard } from './ReviewCard';
import type { ProductReviewItem, CustomerRatingInterface } from '../../api/interfaces';

interface ReviewsSectionProps {
  reviews:                  ProductReviewItem[];
  totalReviewCount:         number;
  myReview:                 ProductReviewItem | null;
  isProductPurchasedBefore: boolean;
  customerRating:           CustomerRatingInterface | null;
  onWriteReview:            () => void;
  onSeeAllReviews:          () => void;
}

// Product page shows a trimmed preview (rating summary + up to 2 reviews);
// the full paginated list lives on its own screen (ProductReviewsScreen),
// same split as Amazon's embedded vs. full reviews view.
const PREVIEW_COUNT = 2;

const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

const RatingSummary: React.FC<{ rating: CustomerRatingInterface; onPress: () => void }> = ({ rating, onPress }) => (
  <TouchableOpacity style={styles.summary} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.summaryHeaderRow}>
      <Text style={styles.summaryAvg}>{rating.AvgRating.toFixed(1)}</Text>
      <View style={styles.summaryHeaderText}>
        <Rating value={rating.AvgRating} size={14} />
        <Text style={styles.summaryCount}>
          {rating.TotalReviews.toLocaleString('en-IN')} rating{rating.TotalReviews === 1 ? '' : 's'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={Colors.ink4} />
    </View>

    <View style={styles.barsCol}>
      {STAR_LEVELS.map(star => {
        const count = rating.RatingDistribution[star] ?? 0;
        const pct = rating.TotalReviews > 0 ? (count / rating.TotalReviews) * 100 : 0;
        return (
          <View key={star} style={styles.barRow}>
            <Text style={styles.barLabel}>{star}★</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.barPct}>{Math.round(pct)}%</Text>
          </View>
        );
      })}
    </View>
  </TouchableOpacity>
);

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  totalReviewCount,
  myReview,
  isProductPurchasedBefore,
  customerRating,
  onWriteReview,
  onSeeAllReviews,
}) => {
  const otherReviews = myReview
    ? reviews.filter(r => r.ReviewId !== myReview.ReviewId)
    : reviews;
  const previewOthers = otherReviews.slice(0, myReview ? PREVIEW_COUNT - 1 : PREVIEW_COUNT);
  // Backend rejects addProductReview with NOT_ELIGIBLE for a customer who
  // hasn't purchased and received the item — hide the entry point rather
  // than let them fill out the form and hit that error at submit. A customer
  // who already has a review can always reopen it to edit, regardless of
  // purchase eligibility (that check only gates *new* reviews).
  const canWriteReview = !!myReview || isProductPurchasedBefore;

  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewer = (images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Ratings & Reviews</Text>
        {canWriteReview ? (
          <TextLinkButton
            label={myReview ? 'Edit your review' : totalReviewCount === 0 ? 'Write a review' : 'Write yours'}
            onPress={onWriteReview}
          />
        ) : null}
      </View>

      {customerRating && customerRating.TotalReviews > 0 ? (
        <RatingSummary rating={customerRating} onPress={onSeeAllReviews} />
      ) : null}

      {myReview ? <ReviewCard review={myReview} isMine onPressImage={openViewer} /> : null}

      {previewOthers.length > 0 ? (
        <View style={[styles.list, myReview ? styles.listSpaced : null]}>
          {previewOthers.map(r => (
            <ReviewCard key={r.ReviewId} review={r} onPressImage={openViewer} />
          ))}
        </View>
      ) : !myReview ? (
        <Text style={styles.emptyText}>
          No reviews yet — be the first to share your thoughts.
          {isProductPurchasedBefore ? ' Your review will be marked Verified Purchase.' : ''}
        </Text>
      ) : null}

      {totalReviewCount > (myReview ? previewOthers.length + 1 : previewOthers.length) ? (
        <TextLinkButton
          label={`See all ${totalReviewCount.toLocaleString('en-IN')} reviews`}
          onPress={onSeeAllReviews}
          style={styles.seeAllButton}
        />
      ) : null}

      {viewerImages ? (
        <ReviewImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerImages(null)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  summary: {
    marginBottom: Space[5],
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
    marginBottom:  Space[3],
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryAvg: {
    fontFamily: FontFamily.serif,
    fontSize:   36,
    color:      Colors.ink1,
    letterSpacing: -0.5,
  },
  summaryCount: {
    ...Type.caption,
    color:     Colors.ink4,
    marginTop: Space[1],
  },
  barsCol: {
    gap: Space[1],
  },
  barRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  barLabel: {
    ...Type.caption,
    color: Colors.ink3,
    width: 24,
  },
  barTrack: {
    flex:            1,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.rule,
    overflow:        'hidden',
  },
  barFill: {
    height:          '100%',
    borderRadius:    3,
    backgroundColor: Colors.star,
  },
  barPct: {
    ...Type.caption,
    color:     Colors.ink4,
    width:     36,
    textAlign: 'right',
  },
  section: {
    paddingTop:        Space[6],
    paddingBottom:      Space[4],
    paddingHorizontal:  Space.screenH,
    borderTopWidth:     StyleSheet.hairlineWidth,
    borderTopColor:     Colors.rule,
  },
  headingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[4],
  },
  heading: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  emptyText: {
    ...Type.body,
    color: Colors.ink4,
  },
  list: {
    gap: Space[4],
  },
  listSpaced: {
    marginTop: Space[4],
  },
  seeAllButton: {
    alignSelf: 'center',
    marginTop: Space[4],
  },
});
