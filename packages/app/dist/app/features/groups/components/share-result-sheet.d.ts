type Props = {
    visible: boolean;
    onClose: () => void;
    question: string;
    winnerName: string;
    winnerAvatarUri?: string | null;
    winnerVoteCount: number;
    groupName: string;
};
export declare function ShareResultSheet({ visible, onClose, question, winnerName, winnerAvatarUri, winnerVoteCount, groupName, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
