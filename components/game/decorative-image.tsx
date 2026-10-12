import type { ImgHTMLAttributes } from "react";

// Reserve the frame even when a decorative image is unavailable. The ref also
// handles an image that finished loading before hydration attached its events.
export function DecorativeImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt="" loading="lazy" decoding="async"
    ref={image => { if (image) image.dataset.loaded = image.complete && image.naturalWidth > 0 ? "true" : "false"; }}
    onLoad={event => { event.currentTarget.dataset.loaded = "true"; }}
    onError={event => { event.currentTarget.dataset.loaded = "false"; }}
  />;
}
