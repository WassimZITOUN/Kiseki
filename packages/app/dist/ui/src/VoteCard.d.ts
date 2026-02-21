type Props = {
    userId: string;
    name: string;
    avatarUri?: string | null;
    selected?: boolean;
    onPress?: (userId: string) => void;
    disabled?: boolean;
    compact?: boolean;
};
export declare function VoteCard({ userId, name, avatarUri, selected, onPress, disabled, compact, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
