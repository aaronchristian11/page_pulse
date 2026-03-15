declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone_number: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}