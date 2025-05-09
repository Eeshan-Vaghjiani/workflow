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
}

export interface BreadcrumbItem {
    title: string
    href: string
} 