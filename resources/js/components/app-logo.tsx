export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden">
                <img src="/logo.png" alt="Workflow Logo" className="w-full h-full object-cover" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Workflow</span>
            </div>
        </>
    );
}
