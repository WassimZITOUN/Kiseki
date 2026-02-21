type WebGlassOptions = {
    blur?: number;
    tintAlpha?: number;
    borderAlpha?: number;
    shadow?: string;
};
export declare function getWebGlassStyle({ blur, tintAlpha, borderAlpha, shadow, }?: WebGlassOptions): {
    readonly backgroundColor: `rgba(255,255,255,${number})`;
    readonly borderWidth: 1;
    readonly borderColor: `rgba(255,255,255,${number})`;
    readonly backdropFilter: string;
    readonly WebkitBackdropFilter: string;
    readonly boxShadow: `${string}, inset 0 1px 0 rgba(255,255,255,0.27), inset 0 -1px 0 rgba(255,255,255,0.06)`;
};
export {};
