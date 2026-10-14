import { nativeComparisonsLife } from "./nativeComparisonsLife";
import { nativeComparisonsSocial } from "./nativeComparisonsSocial";

export const nativeComparisons = {
  ...nativeComparisonsSocial,
  ...nativeComparisonsLife,
};
