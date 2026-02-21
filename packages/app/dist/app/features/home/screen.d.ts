import type { Profile } from "@my-app/types";
type Props = {
    profile?: Profile | null;
    onNavigateProfile?: () => void;
    onNavigateGroup?: (id: string) => void;
    onNavigateCreate?: () => void;
    onNavigateJoin?: () => void;
};
export declare function HomeScreen({ profile, onNavigateProfile, onNavigateGroup, onNavigateCreate, onNavigateJoin, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
