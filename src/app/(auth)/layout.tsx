import { AppSidebar } from "@/components/app-sidebar";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-metallic">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
