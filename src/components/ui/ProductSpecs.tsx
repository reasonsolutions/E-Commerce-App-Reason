import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Space, Radius } from '../../theme';
import { FontFamily } from '../../theme/fonts';
import type { ProductPolicyInfo, ProductShippingInfo } from '../../api/interfaces';
import { warrantyTypeLabel } from '../../utils/warrantyType';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface ProductSpecsProps {
  color?: string | null;
  material?: string | null;
  care?: string | null;
  weight?: number | null;
  weightUnit?: string | null;
  description?: string | null;
  season?: string | null;
  demographic?: string | null;
  countryOfOrigin?: string | null;
  manufacturer?: string | null;
  manufacturerPartNumber?: string | null;
  hsCode?: string | null;
  packageDimensions?: {
    length: number | null;
    width: number | null;
    height: number | null;
    unit: string | null;
  } | null;
  policy?: ProductPolicyInfo | null;
  shipping?: ProductShippingInfo | null;
}

const AccordionRow: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };

  return (
    <View style={styles.accordionWrap}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Icon name={open ? 'remove' : 'add'} size={18} color={Colors.ink2} />
      </TouchableOpacity>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
};

export const ProductSpecs: React.FC<ProductSpecsProps> = ({
  color,
  material,
  care,
  weight,
  weightUnit,
  description,
  season,
  demographic,
  countryOfOrigin,
  manufacturer,
  manufacturerPartNumber,
  hsCode,
  packageDimensions,
  policy,
  shipping,
}) => {
  const specRows: [string, string][] = [];
  if (color)       specRows.push(['Colour',      color]);
  if (material)    specRows.push(['Material',    material]);
  if (demographic) specRows.push(['For',         demographic]);
  if (season)      specRows.push(['Season',      season]);
  if (weight != null) {
    const unit = weightUnit ?? '';
    specRows.push(['Weight', unit ? `${weight} ${unit}` : String(weight)]);
  }

  const careSteps = care
    ? care.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  const descriptionLines = description
    ? description.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  const specificationRows: [string, string][] = [];
  if (countryOfOrigin)        specificationRows.push(['Origin',       countryOfOrigin]);
  if (manufacturer)           specificationRows.push(['Manufacturer', manufacturer]);
  if (manufacturerPartNumber) specificationRows.push(['Part no.',     manufacturerPartNumber]);
  if (hsCode)                 specificationRows.push(['HS code',      hsCode]);

  const packageTag =
    packageDimensions &&
    packageDimensions.length != null &&
    packageDimensions.width != null &&
    packageDimensions.height != null
      ? `Package: ${packageDimensions.length} x ${packageDimensions.width} x ${packageDimensions.height} ${packageDimensions.unit ?? ''}`.trim()
      : null;

  const policyRows: [string, string][] = [];
  if (policy) {
    policyRows.push([
      'Returns',
      policy.IsReturnable
        ? (policy.ReturnWindow ? `${policy.ReturnWindow}-day return window` : 'Eligible for return')
        : 'Not returnable',
    ]);
    if (policy.HasWarranty) {
      const warrantyType = warrantyTypeLabel(policy.WarrantyType);
      policyRows.push([
        'Warranty',
        policy.WarrantyPeriod
          ? `${policy.WarrantyPeriod}-day${warrantyType ? ' ' + warrantyType : ''} warranty`
          : 'Included',
      ]);
    }
    if (shipping?.CanShipInternational) {
      policyRows.push(['International', 'Ships internationally']);
    }
  }

  const returnPolicyLines = policy?.IsReturnable && policy.ReturnPolicy
    ? policy.ReturnPolicy.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  const hasDescription    = descriptionLines.length > 0;
  const hasSpecs          = specRows.length > 0;
  const hasCare           = careSteps.length > 0;
  const hasSpecifications = specificationRows.length > 0 || !!packageTag;
  const hasPolicies       = policyRows.length > 0;

  if (!hasDescription && !hasSpecs && !hasCare && !hasSpecifications && !hasPolicies) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topDivider} />

      {hasDescription && (
        <AccordionRow title="Product Description" defaultOpen>
          {descriptionLines.map((line, i) => (
            <Text key={i} style={[styles.descriptionText, i < descriptionLines.length - 1 && styles.descriptionLineSpacing]}>
              {line}
            </Text>
          ))}
        </AccordionRow>
      )}

      {hasSpecs && (
        <AccordionRow title="Product Details">
          {specRows.map(([label, value], i) => (
            <View
              key={label}
              style={[styles.specRow, i < specRows.length - 1 && styles.specRowBorder]}
            >
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </AccordionRow>
      )}

      {hasCare && (
        <AccordionRow title="Care Instructions">
          {careSteps.map((step, i) => (
            <Text key={i} style={[styles.careStep, i < careSteps.length - 1 && styles.careStepSpacing]}>
              {step}
            </Text>
          ))}
        </AccordionRow>
      )}

      {hasSpecifications && (
        <AccordionRow title="Specifications">
          {specificationRows.map(([label, value], i) => (
            <View
              key={label}
              style={[styles.specRow, i < specificationRows.length - 1 && styles.specRowBorder]}
            >
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
          {packageTag ? (
            <View style={styles.tagRow}>
              <Text style={styles.tagText}>{packageTag}</Text>
            </View>
          ) : null}
        </AccordionRow>
      )}

      {hasPolicies && (
        <AccordionRow title="Policies">
          {policyRows.map(([label, value], i) => (
            <View
              key={label}
              style={[
                styles.specRow,
                (i < policyRows.length - 1 || returnPolicyLines.length > 0) && styles.specRowBorder,
              ]}
            >
              <Text style={styles.specLabel}>{label}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
          {returnPolicyLines.length > 0 && (
            <View style={styles.policyTextWrap}>
              {returnPolicyLines.map((line, i) => (
                <Text
                  key={i}
                  style={[styles.descriptionText, i < returnPolicyLines.length - 1 && styles.descriptionLineSpacing]}
                >
                  {line}
                </Text>
              ))}
            </View>
          )}
        </AccordionRow>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    marginTop:       Space[2],
  },
  topDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Accordion ─────────────────────────────────────────────────────────────────
  accordionWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  accordionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space[4],
    paddingVertical:   Space[4] + 2,
  },
  accordionTitle: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: 0,
  },
  accordionBody: {
    paddingHorizontal: Space[4],
    paddingBottom:     Space[4],
  },
  policyTextWrap: {
    paddingTop: Space[3],
  },

  // ── Description ───────────────────────────────────────────────────────────────
  descriptionText: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    color:       Colors.ink3,
    lineHeight:  13 * 1.68,
  },
  descriptionLineSpacing: {
    marginBottom: Space[3],
  },

  // ── Spec rows ─────────────────────────────────────────────────────────────────
  specRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            Space[3],
    paddingVertical: Space[3],
  },
  specRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  specLabel: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    color:      Colors.ink3,
    flexShrink: 0,
    flexBasis:  '35%',
  },
  specValue: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    color:       Colors.ink1,
    flex:        1,
    textAlign:   'right',
  },

  // ── Tag pills (package/condition) ───────────────────────────────────────────────
  tagRow: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               Space[2],
    paddingTop:        Space[3],
  },
  tagText: {
    fontFamily:        FontFamily.sans,
    fontSize:          11,
    fontWeight:        '500',
    color:             Colors.ink3,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
    borderRadius:      Radius.pill,
    paddingHorizontal: Space[3],
    paddingVertical:   Space[1] + 2,
  },

  // ── Care instructions ────────────────────────────────────────────────────────
  careStep: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    color:      Colors.ink3,
    lineHeight: 13 * 1.68,
  },
  careStepSpacing: {
    marginBottom: Space[3],
  },
});
