export interface User {
    id: number
    name: string
    email: string
    avatar?: string
    workos_id?: string
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

export interface NavItem {
    title: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
    children?: NavItem[]
}

// Removed SharedData interface as it was redundant
