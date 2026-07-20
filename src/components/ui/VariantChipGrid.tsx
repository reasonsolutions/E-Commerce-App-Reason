import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Colors, Space, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import { Type } from '../../theme/typography';

export interface VariantChipOption {
  id: string;
  label: string;
  outOfStock: boolean;
  lowStock: boolean;
}

interface VariantChipGridProps {
  options: VariantChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  sizeChartUrl?: string | null;
  lowStockLabel?: string | null;
  label?: string | null;
}

function inferLabel(options: VariantChipOption[], override?: string | null): string {
  if (override) return override;
  const COLOR_HINTS = /\b(red|blue|green|black|white|grey|gray|pink|yellow|orange|purple|brown|navy|beige|cream|ivory|teal|coral|gold|silver|rose|mint|olive)\b/i;
  const isColor = options.some(o => COLOR_HINTS.test(o.label));
  if (isColor) return 'Select Colour';
  const AGE_HINTS = /\b(\d+\s*[-–]\s*\d+\s*(yr|year|month|mo|m)\b|\d+\s*(yr|year|month|mo|m)\b)/i;
  const isAge = options.some(o => AGE_HINTS.test(o.label));
  if (isAge) return 'Select Age';
  const isSize = options.some(o => /^(XS|S|M|L|XL|XXL|2XL|3XL|\d{1,3}(cm|mm|in|")?|ONE SIZE)$/i.test(o.label.trim()));
  if (isSize) return 'Select Size';
  return 'Select Option';
}

export const VariantChipGrid: React.FC<VariantChipGridProps> = ({
  options,
  selectedId,
  onSelect,
  sizeChartUrl,
  lowStockLabel,
  label,
}) => {
  if (!options.length) return null;

  const sectionTitle = inferLabel(options, label);

  return (
    <View style={styles.container}>
      <View style={styles.divider} />

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        {sizeChartUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(sizeChartUrl)}>
            <Text style={styles.sizeGuide}>Size guide ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        {options.map(opt => {
          const isSelected = opt.id === selectedId;
          return (
            <View key={opt.id} style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => !opt.outOfStock && onSelect(opt.id)}
                activeOpacity={opt.outOfStock ? 1 : 0.7}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                  !isSelected && !opt.outOfStock && styles.chipInStock,
                  opt.outOfStock && styles.chipOOS,
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && styles.chipLabelSelected,
                    opt.outOfStock && styles.chipLabelOOS,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
              {opt.lowStock && !isSelected && !opt.outOfStock ? (
                <View style={styles.lowStockDot} />
              ) : null}
            </View>
          );
        })}
      </View>

      {lowStockLabel ? (
        <View style={styles.lowStockRow}>
          <View style={styles.lowStockDotInline} />
          <Text style={styles.lowStockText}>{lowStockLabel}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Space[4],
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[4],
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Space[3],
  },
  sectionTitle: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '600',
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  sizeGuide: {
    ...Type.caption,
    color: Colors.brandNavy,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Space[2] + 2,
  },
  chip: {
    minWidth:        64,
    height:          36,
    paddingHorizontal: Space[3] + 2,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
  },
  chipSelected: {
    backgroundColor: Colors.brandNavy,
    borderColor:     Colors.brandNavy,
  },
  chipInStock: {
    backgroundColor: Colors.surface,
    borderColor:     Colors.brandNavy,
  },
  chipOOS: {
    backgroundColor: Colors.surfaceSoft,
    borderColor:     Colors.rule,
  },
  chipLabel: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    fontWeight:  '400',
    color:       Colors.ink1,
  },
  chipLabelSelected: {
    color:      '#FFFFFF',
    fontWeight: '500',
  },
  chipLabelOOS: {
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },
  lowStockDot: {
    position:        'absolute',
    top:             3,
    right:           3,
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.accent,
    borderWidth:     1.5,
    borderColor:     Colors.surface,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    marginTop:     Space[3],
  },
  lowStockDotInline: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.accent,
  },
  lowStockText: {
    fontFamily:  FontFamily.sans,
    fontSize:    11,
    fontWeight:  '500',
    color:       Colors.accent,
  },
});
