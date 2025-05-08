import 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Echo: Echo;
        Pusher: typeof Pusher;
    }
}

interface Echo {
    channel(channel: string): EchoChannel;
    private(channel: string): EchoChannel;
    join(channel: string): PresenceChannel;
    leave(channel: string): void;
    connector: any;
}

interface EchoChannel {
    listen(event: string, callback: (data: any) => void): EchoChannel;
    stopListening(event: string): EchoChannel;
    subscribed(callback: Function): EchoChannel;
    error(callback: Function): EchoChannel;
    notification(callback: (notification: any) => void): EchoChannel;
    listenForWhisper(event: string, callback: (data: any) => void): EchoChannel;
    whisper(eventName: string, data: any): EchoChannel;
}

interface PresenceChannel extends EchoChannel {
    here(callback: (users: any[]) => void): PresenceChannel;
    joining(callback: (user: any) => void): PresenceChannel;
    leaving(callback: (user: any) => void): PresenceChannel;
    whisper(eventName: string, data: any): PresenceChannel;
}

export {}; 