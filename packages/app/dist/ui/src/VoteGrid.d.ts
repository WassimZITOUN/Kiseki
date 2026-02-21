export type VoteMember = {
    userId: string;
    name: string;
    avatarUri?: string | null;
};
type Props = {
    members: VoteMember[];
    selectedUserId?: string | null;
    onSelectMember?: (userId: string) => void;
    disabled?: boolean;
};
export declare function VoteGrid({ members, selectedUserId, onSelectMember, disabled, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
