"use client";
function getBackdropFilterValue(blur) {
    const isFirefox = typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent);
    // Firefox can drop the whole backdrop-filter when url(#svg-filter) is combined.
    if (isFirefox) {
        return `blur(${blur}px) saturate(145%) contrast(104%)`;
    }
    return `url("#glass-distortion") blur(${blur}px) saturate(145%) contrast(104%)`;
}
export function getWebGlassStyle({ blur = 8, tintAlpha = 0.06, borderAlpha = 0.24, shadow = "0 14px 36px rgba(0, 0, 0, 0.28)", } = {}) {
    const backdrop = getBackdropFilterValue(blur);
    return {
        backgroundColor: `rgba(255,255,255,${tintAlpha})`,
        borderWidth: 1,
        borderColor: `rgba(255,255,255,${borderAlpha})`,
        // @ts-ignore web-only
        backdropFilter: backdrop,
        // @ts-ignore web-only
        WebkitBackdropFilter: backdrop,
        // @ts-ignore web-only
        boxShadow: `${shadow}, inset 0 1px 0 rgba(255,255,255,0.27), inset 0 -1px 0 rgba(255,255,255,0.06)`,
    };
}
