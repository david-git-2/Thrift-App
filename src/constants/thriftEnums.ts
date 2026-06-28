export const THRIFT_CONDITION_OPTIONS = [
  "NEW_WITH_TAGS",
  "EXCELLENT",
  "GOOD",
  "FAIR"
] as const;

export type ThriftCondition = (typeof THRIFT_CONDITION_OPTIONS)[number];

export const THRIFT_SECTION_OPTIONS = [
  "MALE",
  "FEMALE",
  "UNISEX",
  "KIDS",
  "HOME"
] as const;

export type ThriftSection = (typeof THRIFT_SECTION_OPTIONS)[number];

export const THRIFT_CONDITION_FILTER_OPTIONS = [
  { label: "New With Tags", value: "NEW_WITH_TAGS" as const },
  { label: "Excellent", value: "EXCELLENT" as const },
  { label: "Good", value: "GOOD" as const },
  { label: "Fair", value: "FAIR" as const }
];
