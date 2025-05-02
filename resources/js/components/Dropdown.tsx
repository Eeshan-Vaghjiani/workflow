import { useState, createContext, useContext, Fragment } from 'react';
import { Link } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

const DropdownContext = createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
    toggleOpen: () => void;
}>({
    open: false,
    setOpen: () => { },
    toggleOpen: () => { },
});

interface DropdownProps {
    children: React.ReactNode;
}

export default function Dropdown({ children }: DropdownProps) {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen((previousState) => !previousState);
    };

    return (
        <DropdownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropdownContext.Provider>
    );
}

interface TriggerProps {
    children: React.ReactNode;
}

Dropdown.Trigger = function DropdownTrigger({ children }: TriggerProps) {
    const { open, setOpen, toggleOpen } = useContext(DropdownContext);

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>}
        </>
    );
};

interface ContentProps {
    align?: 'left' | 'right';
    width?: string;
    contentClasses?: string;
    children: React.ReactNode;
}

Dropdown.Content = function DropdownContent({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}: ContentProps) {
    const { open, setOpen } = useContext(DropdownContext);

    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'origin-top-left left-0';
    } else if (align === 'right') {
        alignmentClasses = 'origin-top-right right-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    }

    return (
        <>
            <Transition
                as={Fragment}
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <div
                    className={`absolute z-50 mt-2 rounded-md shadow-lg ${alignmentClasses} ${widthClasses}`}
                    onClick={() => setOpen(false)}
                >
                    <div className={`rounded-md ring-1 ring-black ring-opacity-5 ` + contentClasses}>
                        {children}
                    </div>
                </div>
            </Transition>
        </>
    );
};

interface LinkProps {
    href: string;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    as?: string;
    children: React.ReactNode;
}

Dropdown.Link = function DropdownLink({ href, method = 'post', as = 'a', children }: LinkProps) {
    return (
        <Link
            href={href}
            method={method}
            as={as}
            className="block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out"
        >
            {children}
        </Link>
    );
}; 