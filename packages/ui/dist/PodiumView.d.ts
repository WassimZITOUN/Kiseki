export type PodiumMember = {
    userId: string;
    name: string;
    avatarUri?: string | null;
    voteCount: number;
};
type Props = {
    /** Top 3 members sorted by vote count (index 0 = winner) */
    members: PodiumMember[];
};
export declare function PodiumView({ members }: Props): import("react/jsx-runtime").JSX.Element;
export {};
