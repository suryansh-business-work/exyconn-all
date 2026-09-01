import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll position on navigation.
 *
 * The router keeps the window scroll offset across route changes, so opening a
 * tool from halfway down the (long) tools list dropped the user into the middle
 * of the new page. Behaviour-only component — renders nothing.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 'instant' rather than smooth: on navigation the new page should simply
    // start at the top, not animate past content the user never asked to see.
    globalThis.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
