import type { Profile } from "@my-app/types";
type IndividualVote = {
    voter: Profile;
    target: Profile;
    context_note: string | null;
};
type Props = {
    visible: boolean;
    onClose: () => void;
    votes: IndividualVote[];
    question: string;
};
export declare function VoteDetailsSheet({ visible, onClose, votes, question, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
