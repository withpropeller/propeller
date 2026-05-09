export interface IUser {
    email: string;
    fullName: string;
    phone: string;
    integration: {
        onesignal: {
            id: string;
        };
    };
}
