export const ensureIntersectionObserver = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if ('IntersectionObserver' in window) {
    return;
  }

  void import('intersection-observer');
};
