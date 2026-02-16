import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { PropertyProvider } from "@/context/PropertyContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PropertyProvider>
            <div className="flex min-h-screen bg-[#030712] text-foreground">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <DashboardHeader />
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </PropertyProvider>
    );
}

