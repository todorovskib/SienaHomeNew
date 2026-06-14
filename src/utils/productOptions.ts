import { Color, DimensionOption, Dimensions } from '../types';

export const DEFAULT_PRODUCT_COLORS: Color[] = [
  { name: 'Black', value: '#111111' },
  { name: 'White', value: '#ffffff' },
  { name: 'Gray', value: '#808080' },
  { name: 'Red', value: '#b91c1c' },
];

const toOptionId = (label: string, index: number): string => {
  const normalized = label
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `option-${index + 1}`;
};

export const normalizeDimensionOptionId = toOptionId;

export const buildDefaultDimensionOptions = (dimensions: Dimensions): DimensionOption[] => {
  const baseWidth = Number.isFinite(dimensions.width) && dimensions.width > 0 ? dimensions.width : 55;
  const baseHeight = Number.isFinite(dimensions.height) && dimensions.height > 0 ? dimensions.height : 55;
  const largeWidth = baseWidth >= 65 ? baseWidth + 10 : baseWidth + 10;

  return [
    {
      id: 'standard',
      label: 'Standard',
      width: baseWidth,
      height: baseHeight,
    },
    {
      id: 'large',
      label: 'Large',
      width: largeWidth,
      height: baseHeight,
    },
  ];
};

export const formatDimensionOption = (option: DimensionOption): string =>
  `${option.label} - ${option.width} x ${option.height} cm`;
