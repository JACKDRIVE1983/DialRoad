import centerPlaceholder from '@/assets/center-placeholder.jpg';

export function useCenterImage(
  _centerId: string,
  _name: string,
  _address: string,
  _city: string,
  _lat?: number,
  _lng?: number
): string {
  // Use standard placeholder for all centers
  return centerPlaceholder;
}
