interface User {
    id: number;
    name: string;
}

interface Message {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: User;
}

interface Props {
    newMessage: Message;
}

export default function MessageCreated({ newMessage }: Props) {
    // This component should not render anything, it's just for passing data
    // during Inertia requests to update the ChatBox component state
    return null;
} 