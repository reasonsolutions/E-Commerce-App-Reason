import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';

// Backend has no binary upload endpoint — addProductReview.Images expects an
// array of strings, and the merchant portal's equivalent flow (product/brand/
// category image add) sends base64 data URLs directly in the JSON body. This
// hook mirrors that convention for review photos.
export const MAX_REVIEW_IMAGES = 5;

// The picker's own maxWidth/maxHeight/quality options don't reliably shrink
// every source: quality only affects lossy (JPEG) re-encoding, so a PNG
// (screenshots, some gallery/share sources) can pass through close to its
// original multi-MB size regardless of those options. Re-encoding every
// asset to JPEG via image-resizer after picking guarantees format, dimension,
// and quality regardless of the source file.
//
// image-resizer's response never includes base64 on iOS (only path/uri/
// width/height) — the base64 field exists on Android's response and on the
// raw TurboModule spec type, but isn't populated by the iOS native module.
// So we always read the resized file back ourselves via RNFS for both
// platforms, then delete the temp file once we have its contents.
const MAX_IMAGE_DIMENSION = 1280;
const JPEG_QUALITY = 80;

async function toDataUrl(asset: Asset): Promise<string | null> {
  if (!asset.uri) return null;
  const resized = await ImageResizer.createResizedImage(
    asset.uri,
    MAX_IMAGE_DIMENSION,
    MAX_IMAGE_DIMENSION,
    'JPEG',
    JPEG_QUALITY,
    0,
    undefined,
    false,
    { mode: 'contain', onlyScaleDown: true },
  );
  try {
    const base64 = await RNFS.readFile(resized.path, 'base64');
    return `data:image/jpeg;base64,${base64}`;
  } finally {
    RNFS.unlink(resized.path).catch(() => {});
  }
}

export function useReviewImagePicker(max: number = MAX_REVIEW_IMAGES) {
  const [images, setImages] = useState<string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const remaining = max - images.length;

  const addFromAssets = useCallback(async (assets: Asset[] | undefined) => {
    if (!assets?.length) return;
    const results = await Promise.allSettled(assets.map(toDataUrl));
    const dataUrls = results
      .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((u): u is string => !!u);
    if (!dataUrls.length && results.some(r => r.status === 'rejected')) {
      setPickerError('Could not process the selected photo.');
      return;
    }
    setImages(prev => [...prev, ...dataUrls].slice(0, max));
  }, [max]);

  const pickFromLibrary = useCallback(async () => {
    if (remaining <= 0) return;
    setPickerError(null);
    try {
      const result = await launchImageLibrary({
        mediaType:      'photo',
        selectionLimit: Platform.OS === 'ios' ? remaining : remaining,
      });
      if (result.errorCode) {
        setPickerError(result.errorMessage ?? 'Could not open photo library.');
        return;
      }
      await addFromAssets(result.assets);
    } catch {
      setPickerError('Could not open photo library.');
    }
  }, [remaining, addFromAssets]);

  const pickFromCamera = useCallback(async () => {
    if (remaining <= 0) return;
    setPickerError(null);
    try {
      const result = await launchCamera({
        mediaType:    'photo',
        saveToPhotos: false,
      });
      if (result.errorCode) {
        setPickerError(result.errorMessage ?? 'Could not open camera.');
        return;
      }
      await addFromAssets(result.assets);
    } catch {
      setPickerError('Could not open camera.');
    }
  }, [remaining, addFromAssets]);

  const removeAt = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback((initial: string[] = []) => {
    setImages(initial);
    setPickerError(null);
  }, []);

  return {
    images,
    remaining,
    canAddMore: remaining > 0,
    pickerError,
    pickFromLibrary,
    pickFromCamera,
    removeAt,
    reset,
  };
}
