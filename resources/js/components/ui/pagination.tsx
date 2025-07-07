import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
}

export const Pagination = ({ links }: PaginationProps) => {
    // Filter out "Next" and "Previous" links for custom rendering
    const pageLinks = links.filter(
        (link) => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;'
    );

    const prevLink = links.find((link) => link.label === '&laquo; Previous');
    const nextLink = links.find((link) => link.label === 'Next &raquo;');

    return (
        <div className="flex items-center justify-center space-x-1">
            {/* Previous button */}
            <Button
                variant="outline"
                size="icon"
                disabled={!prevLink?.url}
                asChild={!!prevLink?.url}
            >
                {prevLink?.url ? (
                    <Link href={prevLink.url}>
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronLeft className="h-4 w-4" />
                    </span>
                )}
            </Button>

            {/* Page numbers */}
            {pageLinks.map((link, i) => {
                // For ellipsis
                if (link.label === '...') {
                    return (
                        <Button
                            key={`ellipsis-${i}`}
                            variant="outline"
                            size="icon"
                            disabled
                            className="cursor-default"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    );
                }

                // For page numbers
                return link.url ? (
                    <Button
                        key={link.label}
                        variant={link.active ? 'default' : 'outline'}
                        size="icon"
                        asChild={!link.active}
                    >
                        {link.active ? (
                            <span>{link.label}</span>
                        ) : (
                            <Link href={link.url}>
                                {link.label}
                            </Link>
                        )}
                    </Button>
                ) : null;
            })}

            {/* Next button */}
            <Button
                variant="outline"
                size="icon"
                disabled={!nextLink?.url}
                asChild={!!nextLink?.url}
            >
                {nextLink?.url ? (
                    <Link href={nextLink.url}>
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                ) : (
                    <span>
                        <ChevronRight className="h-4 w-4" />
                    </span>
                )}
            </Button>
        </div>
    );
};
