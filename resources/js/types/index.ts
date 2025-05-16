export interface User {
    id: number
    name: string
    email: string
    avatar?: string
}

export interface PageProps {
    auth: {
        user: User
    }
    [key: string]: unknown
}

export interface BreadcrumbItem {
    title: string
    href: string
}

// Removed SharedData interface as it was redundant
