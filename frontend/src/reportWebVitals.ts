// Importing performance metrics from the 'web-vitals' library
import { onCLS, onINP, onFCP, onLCP, onTTFB } from "web-vitals";

/**
 * Function to report web vitals for performance tracking.
 * This function captures key performance metrics like CLS, INP, FCP, LCP, and TTFB.
 *
 * @param onPerfEntry - Optional callback function that receives the performance metrics.
 *                      It will be called with the metrics as an argument.
 */
const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  // Ensure that the provided onPerfEntry callback is a function before executing
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Call each metric function with the callback to report the performance metrics
    onCLS(onPerfEntry); // Cumulative Layout Shift (CLS)
    onINP(onPerfEntry); // Interaction to Next Paint (INP)
    onFCP(onPerfEntry); // First Contentful Paint (FCP)
    onLCP(onPerfEntry); // Largest Contentful Paint (LCP)
    onTTFB(onPerfEntry); // Time to First Byte (TTFB)
  }
};

// Export the reportWebVitals function for use elsewhere in the project
export default reportWebVitals;
