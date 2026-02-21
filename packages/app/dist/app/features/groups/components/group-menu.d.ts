import type { Group, GroupMemberWithProfile } from "@my-app/types";
type Props = {
    visible: boolean;
    onClose: () => void;
    members: GroupMemberWithProfile[];
    group: Group | null;
    leaving: boolean;
    onLeave: () => void;
    onCopyCode: () => void;
    codeCopied: boolean;
    currentUserId: string | null;
    onRemoveMember?: (userId: string, displayName: string) => void;
};
export declare function GroupMenu({ visible, onClose, members, group, leaving, onLeave, onCopyCode, codeCopied, currentUserId, onRemoveMember, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
