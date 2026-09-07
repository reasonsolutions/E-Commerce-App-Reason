import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { getProductReview } from '../api/review';
import type { ProductReviewItem, CustomerRatingInterface } from '../api/interfaces';
import { useAsyncState } from '../hooks/useAsyncState';
import { ScreenHeader, ReviewCard, Skeleton, ReviewImageViewer, Rating } from '../components/ui';
import { ErrorState } from '../components/system';
import { useProfileCode } from '../hooks/useProfileCode';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

type ProductReviewsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ProductReviews'>;
  route: RouteProp<RootStackParamList, 'ProductReviews'>;
};

const PAGE_SIZE = 10;
const STAR_LEVELS = [5, 4, 3, 2, 1] as const;

const ItemSeparator = () => <View style={styles.separator} />;

const RatingSummary: React.FC<{ rating: CustomerRatingInterface }> = ({ rating }) => (
  <View style={styles.summary}>
    <View style={styles.summaryHeaderRow}>
      <Text style={styles.summaryAvg}>{rating.AvgRating.toFixed(1)}</Text>
      <View>
        <Rating value={rating.AvgRating} size={14} />
        <Text style={styles.summaryCount}>
          {rating.TotalReviews.toLocaleString('en-IN')} rating{rating.TotalReviews === 1 ? '' : 's'}
        </Text>
      </View>
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
  </View>
);

const ProductReviewsScreen: React.FC<ProductReviewsScreenProps> = ({ navigation, route }) => {
  const { itemId, itemName } = route.params;
  const profileCode = useProfileCode();

  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [myReview, setMyReview] = useState<ProductReviewItem | null>(null);
  const [customerRating, setCustomerRating] = useState<CustomerRatingInterface | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const openViewer = (images: string[], index: number) => {
    setViewerImages(images);
    setViewerIndex(index);
  };

  const { loading, isError, error, run } = useAsyncState<ProductReviewItem[]>(null);
  const loadMoreInFlight = useRef(false);

  const fetchFirstPage = useCallback((cancelled: { current: boolean }) => {
    run(async () => {
      const res = await getProductReview({
        ItemId: itemId,
        CustomerProfileCode: profileCode ?? null,
        PageNumber: 1,
        PageSize: PAGE_SIZE,
      });
      if (cancelled.current) return [];
      if (res?.statusCode !== 1) throw new Error(res?.userMessage ?? 'Failed to load reviews.');
      const list = res.result?.Reviews ?? [];
      setReviews(list);
      setMyReview(res.result?.LoggedInCustomer?.Review ?? null);
      setCustomerRating(res.result?.CustomerRating ?? null);
      setTotalRecords(res.result?.TotalRecords ?? 0);
      setPageNumber(1);
      setHasMore(list.length < (res.result?.TotalRecords ?? 0));
      return list;
    }, cancelled);
  }, [run, itemId, profileCode]);

  // Plain effect (not gated to a one-time fetchInitiated ref, unlike
  // BrandsScreen's pattern) — profileCode from useProfileCode() resolves to
  // null on first render even for a logged-in user, so this must rerun once
  // it populates or myReview/CustomerRating would come back permanently null.
  useEffect(() => {
    const cancelled = { current: false };
    fetchFirstPage(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadMoreInFlight.current || !hasMore || loading) return;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageNumber + 1;
      const res = await getProductReview({
        ItemId: itemId,
        CustomerProfileCode: profileCode ?? null,
        PageNumber: nextPage,
        PageSize: PAGE_SIZE,
      });
      if (res?.statusCode !== 1) return;
      const next = res.result?.Reviews ?? [];
      if (next.length > 0) {
        setReviews(prev => {
          const seen = new Set(prev.map(r => r.ReviewId));
          return [...prev, ...next.filter(r => !seen.has(r.ReviewId))];
        });
        setPageNumber(nextPage);
      }
      const total = res.result?.TotalRecords ?? totalRecords;
      setHasMore(pageNumber * PAGE_SIZE + next.length < total);
    } catch {
    } finally {
      loadMoreInFlight.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, loading, pageNumber, itemId, profileCode, totalRecords]);

  const handleRetry = useCallback(() => {
    const cancelled = { current: false };
    fetchFirstPage(cancelled);
  }, [fetchFirstPage]);

  if (isError) {
    return (
      <SafeAreaView style={styles.root} edges={['left', 'right']}>
        <ScreenHeader title="Reviews" onBack={() => navigation.goBack()} />
        <ErrorState
          title="Couldn't load reviews."
          message={error ?? 'Check your connection and try again.'}
          onRetry={handleRetry}
          retryLoading={loading}
        />
      </SafeAreaView>
    );
  }

  const showSkeleton = loading && !reviews.length && pageNumber === 1;
  // otherReviews excludes myReview from the main list so it isn't duplicated —
  // it's pinned to the top separately, same convention as ReviewsSection.
  const otherReviews = myReview ? reviews.filter(r => r.ReviewId !== myReview.ReviewId) : reviews;
  const listData = myReview ? [myReview, ...otherReviews] : otherReviews;

  return (
    // ScreenHeader applies its own top safe-area inset internally — edges
    // omits 'top' here to avoid double-padding above the header.
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <ScreenHeader title="Reviews" subtitle={itemName} onBack={() => navigation.goBack()} />

      {showSkeleton ? (
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={120} radius={12} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => String(item.ReviewId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            customerRating && customerRating.TotalReviews > 0 ? (
              <RatingSummary rating={customerRating} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No reviews yet.</Text>
            </View>
          }
          ItemSeparatorComponent={ItemSeparator}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={Colors.ink3} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ReviewCard review={item} isMine={item.ReviewId === myReview?.ReviewId} onPressImage={openViewer} />
          )}
        />
      )}

      {viewerImages ? (
        <ReviewImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerImages(null)}
        />
      ) : null}
    </SafeAreaView>
  );
};

export default ProductReviewsScreen;

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[6],
  },
  separator: {
    height: Space[4],
  },
  emptyWrap: {
    paddingVertical: Space[8],
    alignItems:      'center',
  },
  emptyText: {
    ...Type.body,
    color: Colors.ink4,
  },
  listFooter: {
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  skeletonWrap: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    gap:               Space[4],
  },
  summary: {
    marginBottom: Space[6],
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[3],
    marginBottom:  Space[3],
  },
  summaryAvg: {
    fontFamily:    FontFamily.serif,
    fontSize:      36,
    color:         Colors.ink1,
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
});
