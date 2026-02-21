export type ResultItem = {
    userId: string;
    name: string;
    avatarUri?: string | null;
    voteCount: number;
    percentage: number;
    comments: string[];
};
type Props = {
    item: ResultItem;
    rank: number;
    delay?: number;
};
export declare function ResultCard({ item, rank, delay }: Props): import("react/jsx-runtime").JSX.Element;
export {};
